import { describe, expect, it } from "vitest";
import { parseAcademicTermInput } from "./academic-terms";

describe("parseAcademicTermInput", () => {
  it("converts inclusive Thai school dates to an exclusive Bangkok range", () => {
    const term = parseAcademicTermInput({
      name: " ภาคเรียนที่ 1/2569 ",
      startsAt: "2026-05-16",
      endsAt: "2026-10-10",
    });

    expect(term.name).toBe("ภาคเรียนที่ 1/2569");
    expect(term.startsAt.toISOString()).toBe("2026-05-15T17:00:00.000Z");
    expect(term.endsAt.toISOString()).toBe("2026-10-10T17:00:00.000Z");
  });

  it("rejects a term that ends before it starts", () => {
    expect(() =>
      parseAcademicTermInput({
        name: "ภาคเรียนผิด",
        startsAt: "2026-10-10",
        endsAt: "2026-05-16",
      }),
    ).toThrow("วันสิ้นสุดภาคเรียนต้องอยู่หลังวันเริ่มต้น");
  });
});
