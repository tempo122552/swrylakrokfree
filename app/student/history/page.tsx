import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/shell/app-shell";
import { DataTable } from "@/components/ui/data-table";
import { getStudentDashboard } from "@/data/students";
import { requirePageRole } from "@/lib/auth/require-page-role";

export default async function StudentHistoryPage() {
  const currentUser = await requirePageRole([UserRole.STUDENT]);
  const dashboard = await getStudentDashboard(currentUser);

  return (
    <AppShell
      title="ประวัติการแลกขยะ"
      subtitle={`${dashboard.student.fullName} · ${dashboard.student.classroom}`}
      navItems={[
        { href: "/student", label: "แต้มของฉัน" },
        { href: "/student/history", label: "ประวัติ" },
      ]}
    >
      <section>
        <h2 className="mb-3 text-lg font-black">รายการแลกขยะ</h2>
        <div className="grid gap-2 md:hidden">
          {dashboard.recentExchanges.length > 0 ? (
            dashboard.recentExchanges.map((exchange) => (
              <article
                className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                key={exchange.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold text-slate-600">
                    {new Date(exchange.createdAt).toLocaleString("th-TH")}
                  </p>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-black text-emerald-800">
                    {exchange.totalPointsEarned} แต้ม
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-800">
                  {exchange.items
                    .map(
                      (item) =>
                        `${item.wasteTypeName} ${item.itemCount} ชิ้น ได้ ${item.pointsEarned} แต้ม`,
                    )
                    .join(", ")}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-slate-200 bg-white p-4 text-center text-sm font-bold text-slate-500">
              ยังไม่มีรายการแลกขยะ
            </p>
          )}
        </div>
        <div className="hidden md:block">
          <DataTable
            headers={["วันที่", "แต้ม", "รายละเอียด"]}
            rows={dashboard.recentExchanges.map((exchange) => [
              new Date(exchange.createdAt).toLocaleString("th-TH"),
              exchange.totalPointsEarned,
              exchange.items
                .map(
                  (item) =>
                    `${item.wasteTypeName} ${item.itemCount} ชิ้น ได้ ${item.pointsEarned} แต้ม`,
                )
                .join(", "),
            ])}
          />
        </div>
      </section>
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-black">รายการปรับแก้แต้ม</h2>
        <div className="grid gap-2 md:hidden">
          {dashboard.recentAdjustments.length > 0 ? (
            dashboard.recentAdjustments.map((adjustment) => (
              <article
                className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                key={adjustment.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold text-slate-600">
                    {new Date(adjustment.createdAt).toLocaleString("th-TH")}
                  </p>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-black text-amber-800">
                    {adjustment.pointDelta} แต้ม
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-800">
                  {adjustment.reason}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-slate-200 bg-white p-4 text-center text-sm font-bold text-slate-500">
              ยังไม่มีรายการปรับแก้แต้ม
            </p>
          )}
        </div>
        <div className="hidden md:block">
          <DataTable
            headers={["วันที่", "แต้ม", "เหตุผล"]}
            rows={dashboard.recentAdjustments.map((adjustment) => [
              new Date(adjustment.createdAt).toLocaleString("th-TH"),
              adjustment.pointDelta,
              adjustment.reason,
            ])}
          />
        </div>
      </section>
    </AppShell>
  );
}
