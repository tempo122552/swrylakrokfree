import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  if (user.role === UserRole.STUDENT) {
    redirect("/student");
  }

  if (user.role === UserRole.STAFF) {
    redirect("/staff");
  }

  redirect("/teacher");
}
