import { UserRole } from "@prisma/client";
import { Plus, PowerOff, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { listWasteTypes } from "@/data/waste-types";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { teacherNavItems } from "@/lib/navigation";
import {
  createWasteTypeAction,
  deactivateWasteTypeAction,
  deleteWasteTypeAction,
} from "../actions";

function formatWasteRate(itemsPerPoint: number, pointsPerUnit: number) {
  return `${itemsPerPoint.toLocaleString("th-TH")} ชิ้น / ${pointsPerUnit.toLocaleString(
    "th-TH",
  )} แต้ม`;
}

export default async function WasteTypesPage({
  searchParams,
}: {
  searchParams: Promise<{
    deleted?: string;
    error?: string;
    saved?: string;
    updated?: string;
  }>;
}) {
  await requirePageRole([UserRole.TEACHER]);
  const [wasteTypes, params] = await Promise.all([listWasteTypes(), searchParams]);

  return (
    <AppShell
      title="กติกาขยะ"
      subtitle="กำหนดชนิดขยะ จำนวนชิ้นต่อรอบ และแต้มที่ได้ต่อรอบ"
      navItems={teacherNavItems}
    >
      {params.saved ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          บันทึกชนิดขยะแล้ว หากชื่อเดิมถูกปิดใช้งาน ระบบจะเปิดกลับมาใช้และอัปเดตกติกาให้
        </p>
      ) : null}
      {params.updated ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          อัปเดตสถานะชนิดขยะแล้ว
        </p>
      ) : null}
      {params.deleted ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          ลบชนิดขยะแล้ว
        </p>
      ) : null}
      {params.error ? (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          {params.error}
        </p>
      ) : null}

      <form
        action={createWasteTypeAction}
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_160px_160px_auto]"
      >
        <input
          className="min-h-11 rounded-md border border-slate-300 px-3 py-2"
          name="name"
          placeholder="ชื่อชนิดขยะ เช่น มือถือเก่า"
          required
        />
        <input
          className="min-h-11 rounded-md border border-slate-300 px-3 py-2"
          min={1}
          name="itemsPerPoint"
          placeholder="ชิ้นต่อรอบ"
          required
          type="number"
        />
        <input
          className="min-h-11 rounded-md border border-slate-300 px-3 py-2"
          min={1}
          name="pointsPerUnit"
          placeholder="แต้มต่อรอบ"
          required
          type="number"
        />
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-black text-white hover:bg-emerald-800">
          <Plus aria-hidden size={18} />
          เพิ่ม
        </button>
      </form>

      <section className="mt-6">
        <DataTable
          headers={["ชนิดขยะ", "กติกาคะแนน", "สถานะ", "คำสั่ง"]}
          rows={wasteTypes.map((wasteType) => [
            wasteType.name,
            formatWasteRate(wasteType.itemsPerPoint, wasteType.pointsPerUnit),
            <Badge key={`${wasteType.id}-status`} tone={wasteType.isActive ? "emerald" : "slate"}>
              {wasteType.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </Badge>,
            <div className="flex flex-wrap gap-2" key={wasteType.id}>
              {wasteType.isActive ? (
                <form action={deactivateWasteTypeAction}>
                  <input name="wasteTypeId" type="hidden" value={wasteType.id} />
                  <button className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-bold hover:bg-slate-50">
                    <PowerOff aria-hidden size={15} />
                    ปิดใช้งาน
                  </button>
                </form>
              ) : null}
              <form action={deleteWasteTypeAction}>
                <input name="wasteTypeId" type="hidden" value={wasteType.id} />
                <button className="inline-flex min-h-10 items-center gap-2 rounded-md border border-rose-300 px-3 py-1.5 text-sm font-bold text-rose-700 hover:bg-rose-50">
                  <Trash2 aria-hidden size={15} />
                  ลบ
                </button>
              </form>
            </div>,
          ])}
        />
      </section>
    </AppShell>
  );
}
