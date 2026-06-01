import "server-only";
import { prisma } from "@/data/db";
import { requireSystemTeacher, type CurrentUser } from "@/data/permissions";

export async function listWasteTypes() {
  return prisma.wasteType.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

export async function createWasteType(
  currentUser: CurrentUser | null,
  input: { name: string; itemsPerPoint: number },
) {
  requireSystemTeacher(currentUser);

  if (!input.name.trim()) {
    throw new Error("กรอกชื่อชนิดขยะ");
  }

  if (!Number.isInteger(input.itemsPerPoint) || input.itemsPerPoint < 1) {
    throw new Error("อัตราแต้มต้องเป็นจำนวนเต็มบวก");
  }

  return prisma.wasteType.create({
    data: {
      name: input.name.trim(),
      itemsPerPoint: input.itemsPerPoint,
    },
  });
}

export async function setWasteTypeActive(
  currentUser: CurrentUser | null,
  wasteTypeId: string,
  isActive: boolean,
) {
  requireSystemTeacher(currentUser);

  return prisma.wasteType.update({
    where: { id: wasteTypeId },
    data: { isActive },
  });
}
