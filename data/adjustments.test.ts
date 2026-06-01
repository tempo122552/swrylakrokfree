import { describe, expect, it } from "vitest";
import { parsePointAdjustmentDraft } from "./adjustments";

describe("parsePointAdjustmentDraft", () => {
  it("rejects a blank reason", () => {
    expect(() =>
      parsePointAdjustmentDraft({
        studentProfileId: "student_1",
        pointDelta: 1,
        reason: " ",
        remainderAdjustments: [],
      }),
    ).toThrow("กรอกเหตุผลการปรับแก้");
  });

  it("rejects zero point delta without a remainder adjustment", () => {
    expect(() =>
      parsePointAdjustmentDraft({
        studentProfileId: "student_1",
        pointDelta: 0,
        reason: "แก้รายการ",
        remainderAdjustments: [],
      }),
    ).toThrow("ต้องมีการเปลี่ยนแต้มหรือเศษคงค้าง");
  });
});
