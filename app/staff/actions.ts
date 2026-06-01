"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPointAdjustment } from "@/data/adjustments";
import { createExchange } from "@/data/exchanges";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function createExchangeAction(formData: FormData) {
  const wasteTypeIds = formData.getAll("wasteTypeId").map(String);
  const itemCounts = formData.getAll("itemCount").map((value) => Number(value));
  const studentProfileId = String(formData.get("studentProfileId") ?? "");

  await createExchange(await getCurrentUser(), {
    studentProfileId,
    items: wasteTypeIds
      .map((wasteTypeId, index) => ({
        wasteTypeId,
        itemCount: itemCounts[index] ?? 0,
      }))
      .filter((item) => item.wasteTypeId && item.itemCount > 0),
  });

  revalidatePath("/staff");
  redirect("/staff?created=1");
}

export async function createPointAdjustmentAction(formData: FormData) {
  const wasteTypeId = String(formData.get("wasteTypeId") ?? "");
  const newRemainderValue = String(formData.get("newRemainder") ?? "");
  const remainderAdjustments =
    wasteTypeId && newRemainderValue !== ""
      ? [{ wasteTypeId, newRemainder: Number(newRemainderValue) }]
      : [];

  await createPointAdjustment(await getCurrentUser(), {
    studentProfileId: String(formData.get("studentProfileId") ?? ""),
    relatedExchangeId:
      String(formData.get("relatedExchangeId") ?? "").trim() || undefined,
    pointDelta: Number(formData.get("pointDelta") ?? 0),
    reason: String(formData.get("reason") ?? ""),
    remainderAdjustments,
  });

  revalidatePath("/staff/adjustments");
  redirect("/staff/adjustments?created=1");
}
