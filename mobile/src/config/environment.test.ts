import { resolveEnvironment } from "./environment";

describe("resolveEnvironment", () => {
  it("accepts an Android emulator development URL", () => {
    expect(resolveEnvironment({
      appEnvironment: "development",
      apiBaseUrl: "http://10.0.2.2:4010/",
    })).toEqual({
      ok: true,
      value: {
        appEnvironment: "development",
        apiBaseUrl: "http://10.0.2.2:4010",
      },
    });
  });

  it("rejects an insecure production URL", () => {
    expect(resolveEnvironment({
      appEnvironment: "production",
      apiBaseUrl: "http://api.example.com",
    })).toEqual({ ok: false, message: "Production API должен использовать HTTPS." });
  });

  it("fails closed when the base URL is missing", () => {
    expect(resolveEnvironment({ appEnvironment: "development" }).ok).toBe(false);
  });
});
