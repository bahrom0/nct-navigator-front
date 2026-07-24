import { ApiError, requestJson } from "./client";

export type SystemStatus = {
  enabled: boolean;
  message: string;
  maintenanceVariant: "standard" | "blackout";
  updatedAt: string | null;
};

type SystemStatusResponse = { status: "success"; data: unknown };

export async function getSystemStatus(signal?: AbortSignal): Promise<SystemStatus> {
  const response = await requestJson<SystemStatusResponse>("/api/system/status", { signal });
  if (response.status !== "success" || !isSystemStatus(response.data)) {
    throw new ApiError("Некорректный контракт /api/system/status.", "invalid-response");
  }
  return response.data;
}

export function isSystemStatus(value: unknown): value is SystemStatus {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.enabled === "boolean" &&
    typeof item.message === "string" &&
    (item.maintenanceVariant === "standard" || item.maintenanceVariant === "blackout") &&
    (item.updatedAt === null || typeof item.updatedAt === "string")
  );
}
