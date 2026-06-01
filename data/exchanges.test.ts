import { describe, expect, it } from "vitest";
import { parseExchangeDraft } from "./exchanges";

describe("parseExchangeDraft", () => {
  it("accepts multiple waste rows", () => {
    const parsed = parseExchangeDraft({
      studentProfileId: "student_1",
      items: [
        { wasteTypeId: "plastic_bottle", itemCount: 5 },
        { wasteTypeId: "plastic_label", itemCount: 3 },
      ],
    });

    expect(parsed.items).toHaveLength(2);
  });

  it("rejects empty item lists", () => {
    expect(() =>
      parseExchangeDraft({
        studentProfileId: "student_1",
        items: [],
      }),
    ).toThrow("เพิ่มชนิดขยะอย่างน้อย 1 รายการ");
  });
});
