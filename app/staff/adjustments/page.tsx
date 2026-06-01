import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/shell/app-shell";
import { listActiveWasteTypes } from "@/data/exchanges";
import { listStudentsForSelection } from "@/data/students";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { AdjustmentForm } from "./adjustment-form";

export default async function StaffAdjustmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const currentUser = await requirePageRole([UserRole.STAFF]);
  const [students, wasteTypes, params] = await Promise.all([
    listStudentsForSelection(currentUser),
    listActiveWasteTypes(),
    searchParams,
  ]);

  return (
    <AppShell
      title="รายการปรับแก้แต้ม"
      subtitle="บันทึกเหตุผลทุกครั้งเพื่อให้ตรวจสอบย้อนหลังได้"
      navItems={[
        { href: "/staff", label: "บันทึกแลกขยะ" },
        { href: "/staff/adjustments", label: "ปรับแก้แต้ม" },
      ]}
    >
      {params.created ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          บันทึกรายการปรับแก้แล้ว
        </p>
      ) : null}
      <AdjustmentForm students={students} wasteTypes={wasteTypes} />
    </AppShell>
  );
}
