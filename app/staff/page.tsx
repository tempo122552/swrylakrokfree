import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/shell/app-shell";
import { listActiveWasteTypes } from "@/data/exchanges";
import { listStudentsForSelection } from "@/data/students";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { ExchangeForm } from "./exchange-form";

export default async function StaffPage({
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
      title="หน้าของเจ้าหน้าที่"
      subtitle="บันทึกการแลกขยะหลายชนิดในรายการเดียว"
      navItems={[
        { href: "/staff", label: "บันทึกแลกขยะ" },
        { href: "/staff/adjustments", label: "ปรับแก้แต้ม" },
      ]}
    >
      {params.created ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          บันทึกรายการแลกขยะแล้ว
        </p>
      ) : null}
      <ExchangeForm students={students} wasteTypes={wasteTypes} />
    </AppShell>
  );
}
