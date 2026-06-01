import { UserRole } from "@prisma/client";
import { ChevronLeft, ChevronRight, Eye, Search, X } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  defaultTeacherStudentPageSize,
  listStudentClassroomsForTeacher,
  listStudentsForTeacherWithFilters,
  parseTeacherStudentListFilters,
  teacherStudentPageSizeOptions,
  type TeacherStudentStatusFilter,
} from "@/data/students";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { teacherNavItems } from "@/lib/navigation";
import { ImportStudentsForm } from "./import-form";

type TeacherStudentsSearchParams = {
  q?: string | string[];
  classroom?: string | string[];
  status?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
  deleted?: string | string[];
};

const statusOptions: Array<{ value: TeacherStudentStatusFilter; label: string }> = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "active", label: "ใช้งาน" },
  { value: "inactive", label: "ปิดใช้งาน" },
  { value: "must_change_password", label: "รอเปลี่ยนรหัสผ่าน" },
  { value: "password_changed", label: "เปลี่ยนรหัสผ่านแล้ว" },
];

function buildStudentsHref(
  filters: ReturnType<typeof parseTeacherStudentListFilters>,
  overrides: Partial<ReturnType<typeof parseTeacherStudentListFilters>>,
) {
  const nextFilters = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (nextFilters.q) {
    params.set("q", nextFilters.q);
  }

  if (nextFilters.classroom) {
    params.set("classroom", nextFilters.classroom);
  }

  if (nextFilters.status !== "all") {
    params.set("status", nextFilters.status);
  }

  if (nextFilters.page > 1) {
    params.set("page", String(nextFilters.page));
  }

  if (nextFilters.pageSize !== defaultTeacherStudentPageSize) {
    params.set("pageSize", String(nextFilters.pageSize));
  }

  const queryString = params.toString();

  return queryString ? `/teacher/students?${queryString}` : "/teacher/students";
}

export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<TeacherStudentsSearchParams>;
}) {
  const currentUser = await requirePageRole([UserRole.TEACHER]);
  const query = await searchParams;
  const filters = parseTeacherStudentListFilters(query);
  const deletedStudentId = Array.isArray(query.deleted)
    ? query.deleted[0]
    : query.deleted;
  const [studentPage, classrooms] = await Promise.all([
    listStudentsForTeacherWithFilters(currentUser, filters),
    listStudentClassroomsForTeacher(currentUser),
  ]);
  const pageFilters = {
    ...filters,
    page: studentPage.page,
    pageSize: studentPage.pageSize,
  };
  const hasFilters =
    Boolean(filters.q) || Boolean(filters.classroom) || filters.status !== "all";
  const previousHref = buildStudentsHref(pageFilters, {
    page: Math.max(1, studentPage.page - 1),
  });
  const nextHref = buildStudentsHref(pageFilters, {
    page: Math.min(studentPage.totalPages, studentPage.page + 1),
  });

  return (
    <AppShell
      title="ข้อมูลนักเรียน"
      subtitle="นำเข้าจาก CSV/Excel และตรวจบัญชีที่สร้างแล้ว"
      navItems={teacherNavItems}
    >
      <ImportStudentsForm />
      {deletedStudentId ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          ลบนักเรียนเลขประจำตัว {deletedStudentId} แล้ว
        </p>
      ) : null}
      <section className="mt-6">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-black">นักเรียนในระบบ</h2>
            <p className="text-sm font-bold text-slate-500">
              พบ {studentPage.total.toLocaleString("th-TH")} คน
            </p>
          </div>
          {hasFilters ? (
            <Link
              className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              href="/teacher/students"
            >
              <X aria-hidden size={16} />
              ล้างตัวกรอง
            </Link>
          ) : null}
        </div>
        <form
          className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:grid-cols-[minmax(220px,1fr)_190px_220px_160px_auto]"
          method="get"
        >
          <input name="page" type="hidden" value="1" />
          <label className="text-sm font-black text-slate-700">
            ค้นหา
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              defaultValue={filters.q}
              name="q"
              placeholder="เลขประจำตัวหรือชื่อ"
            />
          </label>
          <label className="text-sm font-black text-slate-700">
            ห้องเรียน
            <select
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              defaultValue={filters.classroom}
              name="classroom"
            >
              <option value="">ทุกห้องเรียน</option>
              {classrooms.map((classroom) => (
                <option key={classroom} value={classroom}>
                  {classroom}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-black text-slate-700">
            สถานะบัญชี
            <select
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              defaultValue={filters.status}
              name="status"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-black text-slate-700">
            แถวต่อหน้า
            <select
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              defaultValue={studentPage.pageSize}
              name="pageSize"
            >
              {teacherStudentPageSizeOptions.map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} แถว
                </option>
              ))}
            </select>
          </label>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800 xl:mt-6">
            <Search aria-hidden size={18} />
            ค้นหา
          </button>
        </form>
        <DataTable
          headers={[
            "เลขประจำตัว",
            "ชื่อ-นามสกุล",
            "ระดับชั้น",
            "ห้องเรียน",
            "สถานะบัญชี",
            "รหัสผ่าน",
            "รายละเอียด",
          ]}
          emptyText="ไม่พบนักเรียนตามตัวกรอง"
          rows={studentPage.students.map((student) => [
            student.studentId,
            student.fullName,
            student.gradeLevel,
            student.classroom,
            <Badge key={student.id} tone={student.user.isActive ? "emerald" : "slate"}>
              {student.user.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
            </Badge>,
            <Badge
              key={`${student.id}-password`}
              tone={student.user.mustChangePassword ? "amber" : "blue"}
            >
              {student.user.mustChangePassword
                ? "รอเปลี่ยนรหัสผ่าน"
                : "เปลี่ยนแล้ว"}
            </Badge>,
            <Link
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              href={`/teacher/students/${encodeURIComponent(student.studentId)}`}
              key={`${student.id}-detail`}
            >
              <Eye aria-hidden size={15} />
              ดูโปรไฟล์
            </Link>,
          ])}
        />
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-slate-600">
            แสดง {studentPage.startIndex.toLocaleString("th-TH")}-
            {studentPage.endIndex.toLocaleString("th-TH")} จาก{" "}
            {studentPage.total.toLocaleString("th-TH")} คน · หน้า{" "}
            {studentPage.page.toLocaleString("th-TH")} จาก{" "}
            {studentPage.totalPages.toLocaleString("th-TH")}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {studentPage.page > 1 ? (
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
                href={previousHref}
              >
                <ChevronLeft aria-hidden size={17} />
                ก่อนหน้า
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-400">
                <ChevronLeft aria-hidden size={17} />
                ก่อนหน้า
              </span>
            )}
            {studentPage.page < studentPage.totalPages ? (
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
                href={nextHref}
              >
                ถัดไป
                <ChevronRight aria-hidden size={17} />
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-400">
                ถัดไป
                <ChevronRight aria-hidden size={17} />
              </span>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
