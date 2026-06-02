import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { getStudentDashboard } from "@/data/students";
import { requirePageRole } from "@/lib/auth/require-page-role";

function formatWasteRate(item: { itemsPerPoint: number; pointsPerUnit: number }) {
  return `${item.itemsPerPoint.toLocaleString("th-TH")} ชิ้น / ${item.pointsPerUnit.toLocaleString(
    "th-TH",
  )} แต้ม`;
}

export default async function StudentDashboardPage() {
  const currentUser = await requirePageRole([UserRole.STUDENT]);
  const dashboard = await getStudentDashboard(currentUser);

  return (
    <AppShell
      title="หน้าของนักเรียน"
      subtitle={`${dashboard.student.fullName} / ${dashboard.student.classroom}`}
      navItems={[
        { href: "/student", label: "แต้มของฉัน" },
        { href: "/student/history", label: "ประวัติ" },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          detail="แต้มรวมทั้งหมด"
          label="แต้มสะสม"
          tone="emerald"
          value={dashboard.totalPoints}
        />
        <StatCard
          detail={`จาก ${dashboard.classroomSize} คน`}
          label="อันดับในห้อง"
          tone="amber"
          value={`#${dashboard.classroomRank}`}
        />
        <StatCard
          detail={dashboard.student.gradeLevel}
          label="เลขประจำตัว"
          tone="blue"
          value={dashboard.student.studentId}
        />
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-black">เศษคงค้าง</h2>
            <Badge>สะสมต่อครั้งถัดไป</Badge>
          </div>
          <div className="grid gap-2 md:hidden">
            {dashboard.remainders.length > 0 ? (
              dashboard.remainders.map((item) => (
                <article
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                  key={item.wasteTypeName}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-black text-slate-950">{item.wasteTypeName}</h3>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-black text-emerald-800">
                      {item.itemCount} ชิ้น
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-600">
                    {formatWasteRate(item)}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-lg border border-slate-200 bg-white p-4 text-center text-sm font-bold text-slate-500">
                ยังไม่มีเศษคงค้าง
              </p>
            )}
          </div>
          <div className="hidden md:block">
            <DataTable
              headers={["ชนิดขยะ", "เศษคงค้าง", "อัตราแต้ม"]}
              rows={dashboard.remainders.map((item) => [
                item.wasteTypeName,
                `${item.itemCount} ชิ้น`,
                formatWasteRate(item),
              ])}
            />
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-black">ประวัติล่าสุด</h2>
          <div className="grid gap-2 md:hidden">
            {dashboard.recentExchanges.length > 0 ? (
              dashboard.recentExchanges.map((exchange) => (
                <article
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                  key={exchange.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-slate-600">
                      {new Date(exchange.createdAt).toLocaleDateString("th-TH")}
                    </p>
                    <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-black text-amber-800">
                      {exchange.totalPointsEarned} แต้ม
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-800">
                    {exchange.items
                      .map((item) => `${item.wasteTypeName} ${item.itemCount} ชิ้น`)
                      .join(", ")}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-lg border border-slate-200 bg-white p-4 text-center text-sm font-bold text-slate-500">
                ยังไม่มีประวัติการแลกขยะ
              </p>
            )}
          </div>
          <div className="hidden md:block">
            <DataTable
              headers={["วันที่", "แต้ม", "รายการ"]}
              rows={dashboard.recentExchanges.map((exchange) => [
                new Date(exchange.createdAt).toLocaleDateString("th-TH"),
                exchange.totalPointsEarned,
                exchange.items
                  .map((item) => `${item.wasteTypeName} ${item.itemCount} ชิ้น`)
                  .join(", "),
              ])}
            />
          </div>
        </div>
      </section>
    </AppShell>
  );
}
