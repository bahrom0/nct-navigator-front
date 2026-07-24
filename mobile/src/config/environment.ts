export type AppEnvironment = "development" | "preview" | "production";

export type MobileConfig = {
  appEnvironment: AppEnvironment;
  apiBaseUrl: string;
};

export type ConfigResult =
  | { ok: true; value: MobileConfig }
  | { ok: false; message: string };

type RawEnvironment = {
  appEnvironment?: string;
  apiBaseUrl?: string;
};

export function resolveEnvironment(raw: RawEnvironment): ConfigResult {
  const appEnvironment = raw.appEnvironment?.trim();
  if (!appEnvironment || !["development", "preview", "production"].includes(appEnvironment)) {
    return { ok: false, message: "EXPO_PUBLIC_APP_ENV должен быть development, preview или production." };
  }

  const apiBaseUrl = raw.apiBaseUrl?.trim().replace(/\/$/, "");
  if (!apiBaseUrl) {
    return { ok: false, message: "Не задан EXPO_PUBLIC_API_BASE_URL." };
  }

  try {
    const url = new URL(apiBaseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
    if (appEnvironment === "production" && url.protocol !== "https:") {
      return { ok: false, message: "Production API должен использовать HTTPS." };
    }
  } catch {
    return { ok: false, message: "EXPO_PUBLIC_API_BASE_URL должен быть корректным HTTP(S) URL." };
  }

  return {
    ok: true,
    value: { appEnvironment: appEnvironment as AppEnvironment, apiBaseUrl },
  };
}

export const mobileConfig = resolveEnvironment({
  appEnvironment: process.env.EXPO_PUBLIC_APP_ENV,
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
});
