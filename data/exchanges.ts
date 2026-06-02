import "server-only";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/data/db";
import { requireRole, type CurrentUser } from "@/data/permissions";
import { calculatePointEffect } from "@/data/rewards";

const exchangeDraftSchema = z.object({
  studentProfileId: z.string().min(1),
  items: z
    .array(
      z.object({
        wasteTypeId: z.string().min(1),
        itemCount: z.number().int().positive(),
      }),
    )
    .min(1, "เพิ่มชนิดขยะอย่างน้อย 1 รายการ"),
});

export type ExchangeDraft = z.input<typeof exchangeDraftSchema>;

export function parseExchangeDraft(input: ExchangeDraft) {
  return exchangeDraftSchema.parse(input);
}

export async function listActiveWasteTypes() {
  return prisma.wasteType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createExchange(
  currentUser: CurrentUser | null,
  draft: ExchangeDraft,
) {
  const staff = requireRole(currentUser, [UserRole.STAFF]);
  const parsed = parseExchangeDraft(draft);

  return prisma.$transaction(async (tx) => {
    const wasteTypes = await tx.wasteType.findMany({
      where: {
        id: { in: parsed.items.map((item) => item.wasteTypeId) },
        isActive: true,
      },
    });
    const wasteById = new Map(wasteTypes.map((wasteType) => [wasteType.id, wasteType]));

    if (wasteById.size !== new Set(parsed.items.map((item) => item.wasteTypeId)).size) {
      throw new Error("พบชนิดขยะที่ไม่เปิดใช้งาน");
    }

    const calculatedItems = [];
    let totalPointsEarned = 0;

    for (const item of parsed.items) {
      const wasteType = wasteById.get(item.wasteTypeId);

      if (!wasteType) {
        throw new Error("ไม่พบชนิดขยะ");
      }

      const existingRemainder = await tx.studentRemainder.findUnique({
        where: {
          studentProfileId_wasteTypeId: {
            studentProfileId: parsed.studentProfileId,
            wasteTypeId: item.wasteTypeId,
          },
        },
      });

      const previousRemainder = existingRemainder?.itemCount ?? 0;
      const effect = calculatePointEffect({
        previousRemainder,
        itemCount: item.itemCount,
        itemsPerPoint: wasteType.itemsPerPoint,
        pointsPerUnit: wasteType.pointsPerUnit,
      });

      totalPointsEarned += effect.pointsEarned;
      calculatedItems.push({
        wasteTypeId: item.wasteTypeId,
        itemCount: item.itemCount,
        previousRemainder,
        pointsEarned: effect.pointsEarned,
        newRemainder: effect.newRemainder,
      });
    }

    const exchange = await tx.exchange.create({
      data: {
        studentProfileId: parsed.studentProfileId,
        staffUserId: staff.id,
        totalPointsEarned,
        items: { create: calculatedItems },
      },
    });

    for (const item of calculatedItems) {
      await tx.studentRemainder.upsert({
        where: {
          studentProfileId_wasteTypeId: {
            studentProfileId: parsed.studentProfileId,
            wasteTypeId: item.wasteTypeId,
          },
        },
        update: { itemCount: item.newRemainder },
        create: {
          studentProfileId: parsed.studentProfileId,
          wasteTypeId: item.wasteTypeId,
          itemCount: item.newRemainder,
        },
      });
    }

    return { exchangeId: exchange.id, totalPointsEarned };
  });
}
