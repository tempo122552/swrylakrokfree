import { UserRole } from "@prisma/client";

export function pathForRole(role: UserRole) {
  if (role === UserRole.STUDENT) return "/student";
  if (role === UserRole.STAFF) return "/staff";
  return "/teacher";
}
