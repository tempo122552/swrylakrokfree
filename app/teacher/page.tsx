import { UserRole } from "@prisma/client";
import {
  Activity,
  ArrowRight,
  DatabaseBackup,
  Download,
  History,
  Medal,
  Recycle,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { TeacherCharts } from "@/components/charts/teacher-charts";
import { AppShell } from "@/components/shell/app-shell";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { getTeacherDashboard } from "@/data/reports";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { teacherNavItems } from "@/lib/navigation";

function formatNumber(value: number) {
  return value.toLocaleString("th-TH");
}

export default async function TeacherPage() {
  const currentUser = await requirePageRole([UserRole.TEACHER]);
  const dashboard = await getTeacherDashboard(currentUser);
  const quickLinks = [
    {
      href: "/teacher/history",
      label: "ดูประวัติการแลก",
      detail: "ตรวจรายการล่าสุดและส่งออกข้อมูลเฉพาะช่วง",
      icon: History,
    },
    {
      href: "/teacher/rankings",
      label: "ดูอันดับตามห้อง",
      detail: "ติดตามนักเรียนที่มีแต้มสะสมสูงสุด",
      icon: Medal,
    },
    {
      href: "/teacher/students",
      label: "จัดการนักเรียน",
      detail: "ค้นหา แก้ไขข้อมูล และรีเซ็ตรหัสผ่าน",
      icon: Users,
    },
  ];

  return (
    <AppShell
      title="รายงานภาพรวมของครู"
      subtitle="ติดตามแต้ม ห้องเรียน และสัดส่วนชนิดขยะจากข้อมูลการแลกขยะ"
      navItems={teacherNavItems}
    >
      <div className="mb-5 flex flex-col gap-3 rounded-lg border border-emerald-100 bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-emerald-700">รายงาน Excel</p>
          <p className="text-sm text-slate-600">
            ดาวน์โหลดข้อมูลนักเรียน รายการแลกขยะ อันดับห้องเรียน และสรุปชนิดขยะ
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800"
          href="/teacher/export"
        >
          <Download aria-hidden size={18} />
          ดาวน์โหลด Excel
        </Link>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 hover:bg-emerald-50"
          href="/teacher/backup"
        >
          <DatabaseBackup aria-hidden size={18} />
          สำรองข้อมูลทั้งหมด
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="นักเรียน" tone="blue" value={dashboard.totals.students} />
        <StatCard label="รายการแลกขยะ" tone="emerald" value={dashboard.totals.exchanges} />
        <StatCard label="แต้มรวม" tone="amber" value={dashboard.totals.points} />
        <StatCard label="จำนวนชิ้นรวม" tone="rose" value={dashboard.totals.itemCount} />
      </div>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <Activity aria-hidden size={20} />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-950">กิจกรรมวันนี้</h2>
              <p className="text-sm font-bold text-slate-500">รายการแลกขยะที่บันทึกวันนี้</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <p className="text-2xl font-black text-emerald-800">
                {formatNumber(dashboard.highlights.today.exchangeCount)}
              </p>
              <p className="text-xs font-bold text-slate-500">รายการ</p>
            </div>
            <div>
              <p className="text-2xl font-black text-blue-800">
                {formatNumber(dashboard.highlights.today.itemCount)}
              </p>
              <p className="text-xs font-bold text-slate-500">ชิ้น</p>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-800">
                {formatNumber(dashboard.highlights.today.points)}
              </p>
              <p className="text-xs font-bold text-slate-500">แต้ม</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <Trophy aria-hidden size={20} />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-950">ห้องที่แลกขยะมากที่สุด</h2>
              <p className="text-sm font-bold text-slate-500">จัดจากจำนวนชิ้นสะสม</p>
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-slate-950">
            {dashboard.highlights.topClassroom?.classroom ?? "ยังไม่มีข้อมูล"}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-600">
            {dashboard.highlights.topClassroom
              ? `${formatNumber(dashboard.highlights.topClassroom.items)} ชิ้น · ${formatNumber(dashboard.highlights.topClassroom.points)} แต้ม`
              : "เริ่มบันทึกรายการแลกขยะเพื่อดูสรุป"}
          </p>
        </div>

        <div className="rounded-lg border border-amber-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-md bg-amber-50 text-amber-700">
              <Recycle aria-hidden size={20} />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-950">ชนิดขยะยอดนิยม</h2>
              <p className="text-sm font-bold text-slate-500">จากจำนวนชิ้นรวมทั้งระบบ</p>
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-slate-950">
            {dashboard.highlights.topWasteType?.wasteTypeName ?? "ยังไม่มีข้อมูล"}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-600">
            {dashboard.highlights.topWasteType
              ? `${formatNumber(dashboard.highlights.topWasteType.itemCount)} ชิ้น`
              : "ยังไม่มีรายการขยะในระบบ"}
          </p>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">ทางลัดสำหรับครู</h2>
            <p className="text-sm font-bold text-slate-500">งานที่ใช้บ่อยในเวอร์ชันแรก</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-200 hover:bg-emerald-50/40"
                href={item.href}
                key={item.href}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-800">
                    <Icon aria-hidden size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-black text-slate-950">
                      {item.label}
                    </span>
                    <span className="block text-sm font-bold text-slate-500">
                      {item.detail}
                    </span>
                  </span>
                </span>
                <ArrowRight
                  aria-hidden
                  className="shrink-0 text-slate-400 group-hover:text-emerald-700"
                  size={18}
                />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-6">
        <TeacherCharts
          classroomBars={dashboard.classroomBars}
          wasteTypePie={dashboard.wasteTypePie}
        />
      </div>
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-black">รายการล่าสุด</h2>
        <DataTable
          headers={["วันที่", "นักเรียน", "ห้องเรียน", "แต้ม"]}
          rows={dashboard.recentExchanges.map((exchange) => [
            new Date(exchange.createdAt).toLocaleString("th-TH"),
            exchange.studentName,
            exchange.classroom,
            exchange.totalPointsEarned,
          ])}
        />
      </section>
    </AppShell>
  );
}
