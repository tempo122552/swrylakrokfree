import "server-only";
import { UserRole } from "@prisma/client";

export type CurrentUser = {
  id: string;
  role: UserRole;
  displayName: string;
  isSystemTeacher: boolean;
  mustChangePassword: boolean;
};

export function requireRole(user: CurrentUser | null, allowedRoles: UserRole[]) {
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }

  return user;
}

export function requireSystemTeacher(user: CurrentUser | null) {
  const teacher = requireRole(user, [UserRole.TEACHER]);

  if (!teacher.isSystemTeacher) {
    throw new Error("Forbidden");
  }

  return teacher;
}
