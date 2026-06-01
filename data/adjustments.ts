import "server-only";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/data/db";
import { requireRole, type CurrentUser } from "@/data/permissions";

const remainderAdjustmentSchema = z.object({
  wasteTypeId: z.string().min(1),
  newRemainder: z.number().int().min(0),
});

const pointAdjustmentSchema = z.object({
  studentProfileId: z.string().min(1),
  relatedExchangeId: z.string().min(1).optional(),
  pointDelta: z.number().int(),
  reason: z.string().trim().min(1, "กรอกเหตุผลการปรับแก้"),
  remainderAdjustments: z.array(remainderAdjustmentSchema),
});

export type PointAdjustmentDraft = z.input<typeof pointAdjustmentSchema>;

export function parsePointAdjustmentDraft(input: PointAdjustmentDraft) {
  const parsed = pointAdjustmentSchema.parse(input);

  if (parsed.pointDelta === 0 && parsed.remainderAdjustments.length === 0) {
    throw new Error("ต้องมีการเปลี่ยนแต้มหรือเศษคงค้าง");
  }

  return parsed;
}

export async function createPointAdjustment(
  currentUser: CurrentUser | null,
  draft: PointAdjustmentDraft,
) {
  const staff = requireRole(currentUser, [UserRole.STAFF]);
  const parsed = parsePointAdjustmentDraft(draft);

  return prisma.$transaction(async (tx) => {
    const adjustment = await tx.pointAdjustment.create({
      data: {
        studentProfileId: parsed.studentProfileId,
        createdByUserId: staff.id,
        relatedExchangeId: parsed.relatedExchangeId,
        pointDelta: parsed.pointDelta,
        reason: parsed.reason,
      },
    });

    for (const remainder of parsed.remainderAdjustments) {
      const wasteType = await tx.wasteType.findUniqueOrThrow({
        where: { id: remainder.wasteTypeId },
      });

      if (remainder.newRemainder >= wasteType.itemsPerPoint) {
        throw new Error("เศษคงค้างใหม่ต้องน้อยกว่าอัตราแต้ม");
      }

      const existing = await tx.studentRemainder.findUnique({
        where: {
          studentProfileId_wasteTypeId: {
            studentProfileId: parsed.studentProfileId,
            wasteTypeId: remainder.wasteTypeId,
          },
        },
      });

      await tx.remainderAdjustment.create({
        data: {
          pointAdjustmentId: adjustment.id,
          studentProfileId: parsed.studentProfileId,
          wasteTypeId: remainder.wasteTypeId,
          previousRemainder: existing?.itemCount ?? 0,
          newRemainder: remainder.newRemainder,
          reason: parsed.reason,
        },
      });

      await tx.studentRemainder.upsert({
        where: {
          studentProfileId_wasteTypeId: {
            studentProfileId: parsed.studentProfileId,
            wasteTypeId: remainder.wasteTypeId,
          },
        },
        update: { itemCount: remainder.newRemainder },
        create: {
          studentProfileId: parsed.studentProfileId,
          wasteTypeId: remainder.wasteTypeId,
          itemCount: remainder.newRemainder,
        },
      });
    }

    return { adjustmentId: adjustment.id };
  });
}
