import { describe, expect, it } from "vitest";
import { checkApplicationHealth } from "./health";

describe("checkApplicationHealth", () => {
  it("returns an ok health payload when the database responds", async () => {
    const result = await checkApplicationHealth({
      now: () => new Date("2026-06-01T07:30:00.000Z"),
      pingDatabase: async () => undefined,
    });

    expect(result).toEqual({
      status: 200,
      body: {
        ok: true,
        service: "swrylakrok",
        database: "ok",
        timestamp: "2026-06-01T07:30:00.000Z",
      },
    });
  });

  it("returns a 503 health payload without leaking error details when the database fails", async () => {
    const result = await checkApplicationHealth({
      now: () => new Date("2026-06-01T07:30:00.000Z"),
      pingDatabase: async () => {
        throw new Error("database password leaked here");
      },
    });

    expect(result).toEqual({
      status: 503,
      body: {
        ok: false,
        service: "swrylakrok",
        database: "error",
        timestamp: "2026-06-01T07:30:00.000Z",
      },
    });
  });
});
