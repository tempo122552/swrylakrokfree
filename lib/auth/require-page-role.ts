import "server-only";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { pathForRole } from "@/lib/auth/role-home";

export async function requirePageRole(
  allowedRoles: UserRole[],
  options: { allowMustChangePassword?: boolean; systemTeacher?: boolean } = {},
) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!allowedRoles.includes(user.role)) {
    redirect(pathForRole(user.role));
  }

  if (user.mustChangePassword && !options.allowMustChangePassword) {
    redirect("/change-password");
  }

  if (options.systemTeacher && !user.isSystemTeacher) {
    redirect(pathForRole(user.role));
  }

  return user;
}
