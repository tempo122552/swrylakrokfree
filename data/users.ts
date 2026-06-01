import "server-only";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/data/db";
import { requireRole, requireSystemTeacher, type CurrentUser } from "@/data/permissions";
import {
  generateInitialPassword,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/passwords";

export type LoginResult =
  | {
      ok: true;
      user: {
        id: string;
        role: UserRole;
        displayName: string;
        isSystemTeacher: boolean;
        mustChangePassword: boolean;
      };
    }
  | {
      ok: false;
      message: string;
    };

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "กรอกรหัสผ่านเดิม"),
    newPassword: z.string().min(8, "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"),
    confirmPassword: z.string().min(1, "ยืนยันรหัสผ่านใหม่"),
  })
  .superRefine((value, context) => {
    if (value.newPassword !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        message: "รหัสผ่านใหม่ไม่ตรงกัน",
        path: ["confirmPassword"],
      });
    }

    if (value.currentPassword === value.newPassword) {
      context.addIssue({
        code: "custom",
        message: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม",
        path: ["newPassword"],
      });
    }
  });

export type PasswordChangeInput = z.input<typeof passwordChangeSchema>;

export function parsePasswordChangeInput(input: PasswordChangeInput) {
  return passwordChangeSchema.parse(input);
}

export async function verifyLogin(
  loginName: string,
  password: string,
): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { loginName },
    select: {
      id: true,
      role: true,
      displayName: true,
      passwordHash: true,
      mustChangePassword: true,
      isSystemTeacher: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return { ok: false, message: "ไม่พบบัญชีนี้หรือบัญชีถูกปิดใช้งาน" };
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    return { ok: false, message: "เลขประจำตัวหรือรหัสผ่านไม่ถูกต้อง" };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      role: user.role,
      displayName: user.displayName,
      isSystemTeacher: user.isSystemTeacher,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

export async function listAdultAccounts(currentUser: CurrentUser | null) {
  requireSystemTeacher(currentUser);

  return prisma.user.findMany({
    where: { role: { in: [UserRole.STAFF, UserRole.TEACHER] } },
    orderBy: [{ role: "asc" }, { displayName: "asc" }],
    select: {
      id: true,
      role: true,
      loginName: true,
      displayName: true,
      isSystemTeacher: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function createAdultAccount(
  currentUser: CurrentUser | null,
  input: {
    loginName: string;
    displayName: string;
    role: UserRole;
    isSystemTeacher?: boolean;
  },
) {
  requireSystemTeacher(currentUser);

  if (!input.loginName.trim() || !input.displayName.trim()) {
    throw new Error("กรอกชื่อบัญชีและชื่อผู้ใช้ให้ครบ");
  }

  const initialPassword = generateInitialPassword();
  const passwordHash = await hashPassword(initialPassword);
  const role = input.role === UserRole.TEACHER ? UserRole.TEACHER : UserRole.STAFF;

  await prisma.user.create({
    data: {
      role,
      loginName: input.loginName.trim(),
      displayName: input.displayName.trim(),
      passwordHash,
      mustChangePassword: true,
      isSystemTeacher: role === UserRole.TEACHER && Boolean(input.isSystemTeacher),
    },
  });

  return {
    loginName: input.loginName.trim(),
    displayName: input.displayName.trim(),
    initialPassword,
  };
}

export async function changePassword(
  currentUser: CurrentUser | null,
  input: PasswordChangeInput,
) {
  const user = requireRole(currentUser, [
    UserRole.STUDENT,
    UserRole.STAFF,
    UserRole.TEACHER,
  ]);
  const parsed = parsePasswordChangeInput(input);

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!account) {
    throw new Error("ไม่พบบัญชีผู้ใช้");
  }

  const currentPasswordMatches = await verifyPassword(
    parsed.currentPassword,
    account.passwordHash,
  );

  if (!currentPasswordMatches) {
    throw new Error("รหัสผ่านเดิมไม่ถูกต้อง");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.newPassword),
      mustChangePassword: false,
    },
  });
}
