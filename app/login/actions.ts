"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyLogin } from "@/data/users";
import { pathForRole } from "@/lib/auth/role-home";
import { createSession } from "@/lib/auth/session";

const loginSchema = z.object({
  loginName: z.string().min(1, "กรอกเลขประจำตัวหรือชื่อบัญชี"),
  password: z.string().min(1, "กรอกรหัสผ่าน"),
});

export type LoginFormState = {
  message: string;
};

export async function loginAction(
  _state: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    loginName: formData.get("loginName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const result = await verifyLogin(
    parsed.data.loginName.trim(),
    parsed.data.password,
  );

  if (!result.ok) {
    return { message: result.message };
  }

  await createSession({
    userId: result.user.id,
    role: result.user.role,
    isSystemTeacher: result.user.isSystemTeacher,
  });

  if (result.user.mustChangePassword) {
    redirect("/change-password");
  }

  redirect(pathForRole(result.user.role));
}
