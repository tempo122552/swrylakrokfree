import "server-only";
import { prisma } from "@/data/db";
import { requireSystemTeacher, type CurrentUser } from "@/data/permissions";

export type WasteTypeUsageCounts = {
  exchangeItems: number;
  remainders: number;
  remainderAdjustments: number;
};

export function canHardDeleteWasteType(counts: WasteTypeUsageCounts) {
  return (
    counts.exchangeItems === 0 &&
    counts.remainders === 0 &&
    counts.remainderAdjustments === 0
  );
}

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

  const name = input.name.trim();
  const existing = await prisma.wasteType.findUnique({
    where: { name },
  });

  if (existing) {
    return prisma.wasteType.update({
      where: { id: existing.id },
      data: {
        itemsPerPoint: input.itemsPerPoint,
        isActive: true,
      },
    });
  }

  return prisma.wasteType.create({
    data: {
      name,
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

export async function deleteWasteType(
  currentUser: CurrentUser | null,
  wasteTypeId: string,
) {
  requireSystemTeacher(currentUser);

  const wasteType = await prisma.wasteType.findUnique({
    where: { id: wasteTypeId },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          exchangeItems: true,
          remainders: true,
          remainderAdjustments: true,
        },
      },
    },
  });

  if (!wasteType) {
    throw new Error("ไม่พบชนิดขยะที่ต้องการลบ");
  }

  if (!canHardDeleteWasteType(wasteType._count)) {
    throw new Error(
      "ชนิดขยะนี้มีประวัติการใช้งานแล้ว แนะนำให้ปิดใช้งานแทนการลบ",
    );
  }

  return prisma.wasteType.delete({
    where: { id: wasteType.id },
  });
}
