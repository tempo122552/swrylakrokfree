"use client";

import { Download, FileCheck2, Upload } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { downloadStudentImportResultXlsx } from "@/lib/student-import-result-xlsx";
import {
  confirmImportStudentsAction,
  previewImportStudentsAction,
  type ImportStudentsState,
} from "../actions";

const initialState: ImportStudentsState = {
  message: "",
  errors: [],
  previewRows: [],
  created: [],
};

export function ImportStudentsForm() {
  const [previewState, previewAction, previewPending] = useActionState(
    previewImportStudentsAction,
    initialState,
  );
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmImportStudentsAction,
    initialState,
  );
  const activeState = confirmState.message ? confirmState : previewState;
  const canConfirm =
    previewState.previewRows.length > 0 && previewState.errors.length === 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black">นำเข้าข้อมูลนักเรียน</h2>
          <p className="mt-1 text-sm text-slate-600">
            อัปโหลดไฟล์เพื่อตรวจสอบก่อน แล้วค่อยยืนยันนำเข้าเพื่อสร้างบัญชีจริง
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 px-3 py-2 text-sm font-black text-emerald-800 hover:bg-emerald-50"
          href="/teacher/students/template"
        >
          <Download aria-hidden size={16} />
          ดาวน์โหลด template
        </Link>
      </div>

      <form action={previewAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          accept=".csv,.xlsx,.xls"
          className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 py-2"
          name="studentFile"
          required
          type="file"
        />
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-black text-white disabled:opacity-60"
          disabled={previewPending}
        >
          <Upload aria-hidden size={18} />
          {previewPending ? "กำลังตรวจสอบ" : "ตรวจสอบไฟล์"}
        </button>
      </form>

      {activeState.message ? (
        <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
          {activeState.message}
        </p>
      ) : null}

      {previewState.errors.length > 0 ? (
        <div className="mt-4">
          <DataTable
            headers={["แถว", "ข้อผิดพลาด"]}
            rows={previewState.errors.map((error) => [
              error.rowNumber || "-",
              error.message,
            ])}
          />
        </div>
      ) : null}

      {canConfirm ? (
        <form action={confirmAction} className="mt-4">
          <input
            name="importPayload"
            type="hidden"
            value={JSON.stringify(previewState.previewRows)}
          />
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-black">ตัวอย่างข้อมูลที่จะนำเข้า</h3>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-60"
              disabled={confirmPending}
            >
              <FileCheck2 aria-hidden size={17} />
              {confirmPending ? "กำลังนำเข้า" : "ยืนยันนำเข้า"}
            </button>
          </div>
          <DataTable
            headers={["เลขประจำตัว", "ชื่อ-นามสกุล", "ระดับชั้น", "ห้องเรียน"]}
            rows={previewState.previewRows.map((student) => [
              student.studentId,
              student.fullName,
              student.gradeLevel,
              student.classroom,
            ])}
          />
        </form>
      ) : null}

      {confirmState.created.length > 0 ? (
        <div className="mt-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-black">บัญชีที่สร้างแล้ว</h3>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 px-3 py-2 text-sm font-black text-emerald-800 hover:bg-emerald-50"
              onClick={() => downloadStudentImportResultXlsx(confirmState.created)}
              type="button"
            >
              <Download aria-hidden size={16} />
              ดาวน์โหลด Excel
            </button>
          </div>
          <DataTable
            headers={["เลขประจำตัว", "ชื่อ-นามสกุล", "รหัสผ่านเริ่มต้น"]}
            rows={confirmState.created.map((student) => [
              student.studentId,
              student.fullName,
              student.initialPassword,
            ])}
          />
        </div>
      ) : null}
    </section>
  );
}
