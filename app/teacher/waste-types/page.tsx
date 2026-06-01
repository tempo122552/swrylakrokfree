import { UserRole } from "@prisma/client";
import { Plus, PowerOff } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { listWasteTypes } from "@/data/waste-types";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { teacherNavItems } from "@/lib/navigation";
import { createWasteTypeAction, deactivateWasteTypeAction } from "../actions";

export default async function WasteTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  await requirePageRole([UserRole.TEACHER]);
  const [wasteTypes, params] = await Promise.all([listWasteTypes(), searchParams]);

  return (
    <AppShell
      title="กติกาขยะ"
      subtitle="กำหนดชนิดขยะและจำนวนชิ้นต่อหนึ่งแต้ม"
      navItems={teacherNavItems}
    >
      {params.created ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          เพิ่มชนิดขยะแล้ว
        </p>
      ) : null}
      <form
        action={createWasteTypeAction}
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_auto]"
      >
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          name="name"
          placeholder="ชื่อชนิดขยะ เช่น กระป๋องอะลูมิเนียม"
          required
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          min={1}
          name="itemsPerPoint"
          placeholder="ชิ้นต่อแต้ม"
          required
          type="number"
        />
        <button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-black text-white">
          <Plus aria-hidden size={18} />
          เพิ่ม
        </button>
      </form>
      <section className="mt-6">
        <DataTable
          headers={["ชนิดขยะ", "อัตราแต้ม", "สถานะ", "คำสั่ง"]}
          rows={wasteTypes.map((wasteType) => [
            wasteType.name,
            `${wasteType.itemsPerPoint} ชิ้น / 1 แต้ม`,
            <Badge key={`${wasteType.id}-status`} tone={wasteType.isActive ? "emerald" : "slate"}>
              {wasteType.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </Badge>,
            wasteType.isActive ? (
              <form action={deactivateWasteTypeAction} key={wasteType.id}>
                <input name="wasteTypeId" type="hidden" value={wasteType.id} />
                <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-bold">
                  <PowerOff aria-hidden size={15} />
                  ปิดใช้งาน
                </button>
              </form>
            ) : (
              "-"
            ),
          ])}
        />
      </section>
    </AppShell>
  );
}
