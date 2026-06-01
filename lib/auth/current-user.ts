import "server-only";
import { cache } from "react";
import { prisma } from "@/data/db";
import { readSession } from "./session";

export const getCurrentUser = cache(async () => {
  const session = await readSession();

  if (!session) {
    return null;
  }

  return prisma.user.findFirst({
    where: { id: session.userId, isActive: true },
    select: {
      id: true,
      role: true,
      displayName: true,
      isSystemTeacher: true,
      mustChangePassword: true,
    },
  });
});
