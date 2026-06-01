"use server";

import { redirect } from "next/navigation";
import { changePassword } from "@/data/users";
import { getCurrentUser } from "@/lib/auth/current-user";
import { pathForRole } from "@/lib/auth/role-home";

export type ChangePasswordState = {
  message: string;
};

export async function changePasswordAction(
  _state: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  try {
    await changePassword(currentUser, {
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ",
    };
  }

  redirect(pathForRole(currentUser.role));
}
