import { UserRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { getTeacherStudentProfile } from "@/data/students";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { teacherNavItems } from "@/lib/navigation";
import { StudentManagementPanel } from "./student-management-panel";

export default async function TeacherStudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const currentUser = await requirePageRole([UserRole.TEACHER]);
  const [{ studentId }, query] = await Promise.all([params, searchParams]);
  const profile = await getTeacherStudentProfile(
    currentUser,
    decodeURIComponent(studentId),
  );

  if (!profile) {
    notFound();
  }

  return (
    <AppShell
      title={profile.student.fullName}
      subtitle={`${profile.student.studentId} · ${profile.student.gradeLevel} · ${profile.student.classroom}`}
      navItems={teacherNavItems}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          href="/teacher/students"
        >
          <ArrowLeft aria-hidden size={16} />
          กลับไปข้อมูลนักเรียน
        </Link>
        <div className="flex flex-wrap gap-2">
          <Badge tone={profile.student.isActive ? "emerald" : "slate"}>
            {profile.student.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
          </Badge>
          <Badge tone={profile.student.mustChangePassword ? "amber" : "blue"}>
            {profile.student.mustChangePassword
              ? "ต้องเปลี่ยนรหัสผ่าน"
              : "เปลี่ยนรหัสผ่านแล้ว"}
          </Badge>
        </div>
      </div>

      {query.updated ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          บันทึกข้อมูลนักเรียนแล้ว
        </p>
      ) : null}

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm font-bold text-slate-500">เลขประจำตัวนักเรียน</p>
            <p className="mt-1 text-lg font-black text-slate-950">
              {profile.student.studentId}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">ชื่อบัญชี</p>
            <p className="mt-1 text-lg font-black text-slate-950">
              {profile.student.loginName}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">ระดับชั้น</p>
            <p className="mt-1 text-lg font-black text-slate-950">
              {profile.student.gradeLevel}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">ห้องเรียน</p>
            <p className="mt-1 text-lg font-black text-slate-950">
              {profile.student.classroom}
            </p>
          </div>
        </div>
      </section>

      <StudentManagementPanel student={profile.student} />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="แต้มสะสม" tone="emerald" value={profile.totals.points} />
        <StatCard
          label="รายการแลกขยะ"
          tone="blue"
          value={profile.totals.exchangeCount}
        />
        <StatCard
          label="รายการปรับแก้"
          tone="amber"
          value={profile.totals.adjustmentCount}
        />
        <StatCard
          label="เศษคงค้างรวม"
          tone="rose"
          value={profile.totals.remainderItemCount}
        />
      </div>

      <section className="mt-6">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-black text-slate-950">เศษคงค้าง</h2>
          <p className="text-sm font-bold text-slate-600">สะสมต่อครั้งถัดไป</p>
        </div>
        <DataTable
          emptyText="ยังไม่มีเศษคงค้าง"
          headers={["ชนิดขยะ", "เศษคงค้าง", "อัตราแต้ม", "ขาดอีก"]}
          rows={profile.remainders.map((remainder) => [
            remainder.wasteTypeName,
            `${remainder.itemCount} ชิ้น`,
            `${remainder.itemsPerPoint} ชิ้น / 1 แต้ม`,
            remainder.itemsUntilNextPoint > 0
              ? `${remainder.itemsUntilNextPoint} ชิ้น`
              : "-",
          ])}
        />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-black text-slate-950">ประวัติการแลกล่าสุด</h2>
          <p className="text-sm font-bold text-slate-600">แสดงสูงสุด 20 รายการ</p>
        </div>
        <DataTable
          emptyText="ยังไม่มีประวัติการแลกขยะ"
          headers={["วันที่", "รายการขยะ", "จำนวนชิ้น", "แต้ม", "เจ้าหน้าที่"]}
          rows={profile.recentExchanges.map((exchange) => [
            new Date(exchange.createdAt).toLocaleString("th-TH"),
            <span className="block min-w-64" key={`${exchange.id}-items`}>
              {exchange.itemSummary || "-"}
            </span>,
            exchange.totalItemCount,
            <span
              className="font-black text-emerald-800"
              key={`${exchange.id}-points`}
            >
              {exchange.totalPointsEarned}
            </span>,
            exchange.staffName,
          ])}
        />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-black text-slate-950">รายการปรับแก้แต้ม</h2>
          <p className="text-sm font-bold text-slate-600">แสดงสูงสุด 20 รายการ</p>
        </div>
        <DataTable
          emptyText="ยังไม่มีรายการปรับแก้แต้ม"
          headers={["วันที่", "แต้ม", "เหตุผล", "ผู้บันทึก", "รายการแลกที่เกี่ยวข้อง"]}
          rows={profile.recentAdjustments.map((adjustment) => [
            new Date(adjustment.createdAt).toLocaleString("th-TH"),
            adjustment.pointDelta,
            adjustment.reason,
            adjustment.createdByName,
            adjustment.relatedExchangeId ?? "-",
          ])}
        />
      </section>
    </AppShell>
  );
}
