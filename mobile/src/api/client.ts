import { mobileConfig } from "@/config/environment";

export type MaintenancePayload = {
  status: "maintenance";
  code: "SERVER_DISABLED";
  message: string;
  maintenanceVariant: "standard" | "blackout";
  retryAfter: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: "config" | "timeout" | "network" | "http" | "invalid-response" | "maintenance",
    readonly status?: number,
    readonly maintenance?: MaintenancePayload,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = RequestInit & {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export async function requestJson<T>(path: `/${string}`, options: RequestOptions = {}): Promise<T> {
  if (!mobileConfig.ok) {
    throw new ApiError(mobileConfig.message, "config");
  }

  const { timeoutMs = 10_000, fetchImpl = fetch, signal, ...requestInit } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromParent = () => controller.abort();
  signal?.addEventListener("abort", abortFromParent, { once: true });

  try {
    const response = await fetchImpl(`${mobileConfig.value.apiBaseUrl}${path}`, {
      ...requestInit,
      headers: { Accept: "application/json", ...requestInit.headers },
      signal: controller.signal,
    });

    const payload: unknown = await response.json().catch(() => undefined);
    if (response.status === 503 && isMaintenancePayload(payload)) {
      throw new ApiError(payload.message, "maintenance", 503, payload);
    }
    if (!response.ok) {
      throw new ApiError(`API вернул HTTP ${response.status}.`, "http", response.status);
    }
    if (payload === undefined) {
      throw new ApiError("API вернул некорректный JSON.", "invalid-response", response.status);
    }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) {
      throw new ApiError(signal?.aborted ? "Запрос отменён." : "API не ответил вовремя.", "timeout");
    }
    throw new ApiError(error instanceof Error ? error.message : "Ошибка сети.", "network");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abortFromParent);
  }
}

function isMaintenancePayload(value: unknown): value is MaintenancePayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return item.status === "maintenance" && item.code === "SERVER_DISABLED" && typeof item.message === "string";
}
