import { UserRole } from "@prisma/client";
import { Download, Filter, RotateCcw, Search } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { DataTable } from "@/components/ui/data-table";
import { getTeacherExchangeHistory } from "@/data/exchange-history";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { teacherNavItems } from "@/lib/navigation";

type HistorySearchParams = {
  q?: string | string[];
  classroom?: string | string[];
  dateFrom?: string | string[];
  dateTo?: string | string[];
};

export default async function TeacherHistoryPage({
  searchParams,
}: {
  searchParams: Promise<HistorySearchParams>;
}) {
  const currentUser = await requirePageRole([UserRole.TEACHER]);
  const params = await searchParams;
  const history = await getTeacherExchangeHistory(currentUser, params);
  const exportHref = buildHistoryExportHref(history.filters);

  return (
    <AppShell
      title="ประวัติการแลกแต้ม"
      subtitle="ค้นหารายการย้อนหลังตามวันที่ ห้องเรียน เลขประจำตัวนักเรียน หรือชื่อนักเรียน"
      navItems={teacherNavItems}
    >
      <form
        className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        method="get"
      >
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-emerald-800">
          <Filter aria-hidden size={18} />
          ตัวกรองประวัติ
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.5fr)_minmax(150px,0.8fr)_150px_150px_auto_auto]">
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            ค้นหา
            <input
              className="rounded-md border border-slate-300 px-3 py-2 font-normal"
              defaultValue={history.filters.q ?? ""}
              name="q"
              placeholder="เลขประจำตัวหรือชื่อนักเรียน"
            />
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            ห้องเรียน
            <select
              className="rounded-md border border-slate-300 px-3 py-2 font-normal"
              defaultValue={history.filters.classroom ?? ""}
              name="classroom"
            >
              <option value="">ทุกห้องเรียน</option>
              {history.classrooms.map((classroom) => (
                <option key={classroom} value={classroom}>
                  {classroom}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            ตั้งแต่วันที่
            <input
              className="rounded-md border border-slate-300 px-3 py-2 font-normal"
              defaultValue={history.filters.dateFrom ?? ""}
              name="dateFrom"
              type="date"
            />
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            ถึงวันที่
            <input
              className="rounded-md border border-slate-300 px-3 py-2 font-normal"
              defaultValue={history.filters.dateTo ?? ""}
              name="dateTo"
              type="date"
            />
          </label>
          <button className="inline-flex min-h-10 items-center justify-center gap-2 self-end rounded-md bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800">
            <Search aria-hidden size={18} />
            ค้นหา
          </button>
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 self-end rounded-md border border-slate-300 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
            href="/teacher/history"
          >
            <RotateCcw aria-hidden size={18} />
            ล้าง
          </Link>
        </div>
      </form>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">รายการที่พบ</h2>
          <p className="text-sm font-bold text-slate-600">
            แสดงสูงสุด 100 รายการล่าสุด, พบ {history.rows.length} รายการ
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 hover:bg-emerald-50"
          href={exportHref}
        >
          <Download aria-hidden size={18} />
          ดาวน์โหลดผลลัพธ์ Excel
        </Link>
      </div>

      <DataTable
        emptyText="ไม่พบประวัติการแลกแต้มตามตัวกรองนี้"
        headers={[
          "วันที่",
          "นักเรียน",
          "ห้องเรียน",
          "รายการขยะ",
          "จำนวนชิ้น",
          "แต้ม",
          "เจ้าหน้าที่",
        ]}
        rows={history.rows.map((row) => [
          new Date(row.createdAt).toLocaleString("th-TH"),
          <div className="min-w-44" key={`${row.id}-student`}>
            <p className="font-black text-slate-950">{row.studentName}</p>
            <p className="text-xs font-bold text-slate-500">{row.studentId}</p>
          </div>,
          row.classroom,
          <span className="block min-w-64" key={`${row.id}-items`}>
            {row.itemSummary || "-"}
          </span>,
          row.totalItemCount,
          <span className="font-black text-emerald-800" key={`${row.id}-points`}>
            {row.totalPointsEarned}
          </span>,
          row.staffName,
        ])}
      />
    </AppShell>
  );
}

function buildHistoryExportHref(filters: {
  q?: string;
  classroom?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.classroom) {
    params.set("classroom", filters.classroom);
  }

  if (filters.dateFrom) {
    params.set("dateFrom", filters.dateFrom);
  }

  if (filters.dateTo) {
    params.set("dateTo", filters.dateTo);
  }

  const queryString = params.toString();
  return queryString
    ? `/teacher/history/export?${queryString}`
    : "/teacher/history/export";
}
