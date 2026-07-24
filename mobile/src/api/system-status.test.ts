import { isSystemStatus } from "./system-status";

describe("isSystemStatus", () => {
  it("accepts the backend status contract", () => {
    expect(isSystemStatus({
      enabled: true,
      message: "Сервис доступен",
      maintenanceVariant: "standard",
      updatedAt: null,
    })).toBe(true);
  });

  it("rejects an incomplete payload", () => {
    expect(isSystemStatus({ enabled: true })).toBe(false);
  });
});
