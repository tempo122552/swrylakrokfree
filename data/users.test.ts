import { describe, expect, it } from "vitest";
import { parsePasswordChangeInput } from "./users";

describe("parsePasswordChangeInput", () => {
  it("accepts a confirmed new password", () => {
    const parsed = parsePasswordChangeInput({
      currentPassword: "Password123!",
      newPassword: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });

    expect(parsed).toEqual({
      currentPassword: "Password123!",
      newPassword: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });
  });

  it("rejects mismatched confirmation", () => {
    expect(() =>
      parsePasswordChangeInput({
        currentPassword: "Password123!",
        newPassword: "NewPassword123!",
        confirmPassword: "Different123!",
      }),
    ).toThrow("รหัสผ่านใหม่ไม่ตรงกัน");
  });

  it("rejects reusing the current password", () => {
    expect(() =>
      parsePasswordChangeInput({
        currentPassword: "Password123!",
        newPassword: "Password123!",
        confirmPassword: "Password123!",
      }),
    ).toThrow("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม");
  });
});
