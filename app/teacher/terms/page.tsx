import { UserRole } from "@prisma/client";
import { CalendarPlus } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { listAcademicTerms } from "@/data/academic-terms";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { teacherNavItems } from "@/lib/navigation";
import { createAcademicTermAction } from "../actions";

function formatDate(date: Date) {
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Bangkok",
    year: "numeric",
  });
}

function formatInclusiveEndDate(date: Date) {
  return formatDate(new Date(date.getTime() - 1));
}

export default async function TeacherTermsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const currentUser = await requirePageRole([UserRole.TEACHER]);
  const [terms, params] = await Promise.all([
    listAcademicTerms(currentUser),
    searchParams,
  ]);

  return (
    <AppShell
      title="ภาคเรียน"
      subtitle="กำหนดช่วงวันที่สำหรับสรุปรายงานประจำภาคเรียน"
      navItems={teacherNavItems}
    >
      {params.saved ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          บันทึกภาคเรียนแล้ว
        </p>
      ) : null}
      {params.error ? (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          {params.error}
        </p>
      ) : null}

      {currentUser.isSystemTeacher ? (
        <form
          action={createAcademicTermAction}
          className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_180px_auto]"
        >
          <input
            className="min-h-11 rounded-md border border-slate-300 px-3 py-2"
            name="name"
            placeholder="ชื่อภาคเรียน เช่น ภาคเรียนที่ 1/2569"
            required
          />
          <input
            className="min-h-11 rounded-md border border-slate-300 px-3 py-2"
            name="startsAt"
            required
            type="date"
          />
          <input
            className="min-h-11 rounded-md border border-slate-300 px-3 py-2"
            name="endsAt"
            required
            type="date"
          />
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-black text-white hover:bg-emerald-800">
            <CalendarPlus aria-hidden size={18} />
            เพิ่มภาคเรียน
          </button>
        </form>
      ) : (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
          ครูผู้ดูแลระบบเป็นผู้เพิ่มหรือแก้ไขช่วงภาคเรียน
        </p>
      )}

      <section className="mt-6">
        <DataTable
          emptyText="ยังไม่มีภาคเรียน"
          headers={["ภาคเรียน", "ช่วงวันที่", "สถานะ"]}
          rows={terms.map((term) => [
            term.name,
            `${formatDate(term.startsAt)} - ${formatInclusiveEndDate(term.endsAt)}`,
            <Badge key={term.id} tone={term.isActive ? "emerald" : "slate"}>
              {term.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </Badge>,
          ])}
        />
      </section>
    </AppShell>
  );
}
