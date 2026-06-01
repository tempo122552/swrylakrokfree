"use client";

import { RotateCcw, Save, Trash2 } from "lucide-react";
import { useActionState } from "react";
import {
  deleteStudentProfileAction,
  type DeleteStudentProfileState,
  resetStudentPasswordAction,
  type ResetStudentPasswordState,
  updateStudentProfileAction,
  type UpdateStudentProfileState,
} from "../../actions";

type StudentForManagement = {
  id: string;
  studentId: string;
  fullName: string;
  gradeLevel: string;
  classroom: string;
  isActive: boolean;
};

const updateInitialState: UpdateStudentProfileState = { message: "" };
const resetInitialState: ResetStudentPasswordState = { message: "" };
const deleteInitialState: DeleteStudentProfileState = { message: "" };

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function StudentManagementPanel({
  student,
}: {
  student: StudentForManagement;
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateStudentProfileAction,
    updateInitialState,
  );
  const [resetState, resetAction, resetPending] = useActionState(
    resetStudentPasswordAction,
    resetInitialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteStudentProfileAction,
    deleteInitialState,
  );

  return (
    <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form
        action={updateAction}
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <input name="studentProfileId" type="hidden" value={student.id} />
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-black text-slate-950">แก้ไขข้อมูลนักเรียน</h2>
          <p className="text-sm font-bold text-slate-500">
            เลขประจำตัวนักเรียนจะใช้เป็นชื่อผู้ใช้สำหรับเข้าสู่ระบบ
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-black text-slate-700">
            เลขประจำตัวนักเรียน
            <input
              className={inputClass}
              defaultValue={student.studentId}
              maxLength={32}
              name="studentId"
              required
            />
          </label>
          <label className="text-sm font-black text-slate-700">
            ชื่อ-นามสกุล
            <input
              className={inputClass}
              defaultValue={student.fullName}
              name="fullName"
              required
            />
          </label>
          <label className="text-sm font-black text-slate-700">
            ระดับชั้น
            <input
              className={inputClass}
              defaultValue={student.gradeLevel}
              name="gradeLevel"
              required
            />
          </label>
          <label className="text-sm font-black text-slate-700">
            ห้องเรียน
            <input
              className={inputClass}
              defaultValue={student.classroom}
              name="classroom"
              required
            />
          </label>
        </div>
        <label className="mt-4 flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
          <input
            className="size-4 rounded border-slate-300 accent-emerald-700"
            defaultChecked={student.isActive}
            name="isActive"
            type="checkbox"
          />
          เปิดให้นักเรียนเข้าสู่ระบบได้
        </label>
        <button
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-800 disabled:opacity-60 sm:w-auto"
          disabled={updatePending}
        >
          <Save aria-hidden size={18} />
          {updatePending ? "กำลังบันทึก" : "บันทึกข้อมูล"}
        </button>
        {updateState.message ? (
          <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
            {updateState.message}
          </p>
        ) : null}
      </form>

      <div className="grid gap-4">
        <form
          action={resetAction}
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm"
        >
          <input name="studentProfileId" type="hidden" value={student.id} />
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-lg font-black text-slate-950">รีเซ็ตรหัสผ่าน</h2>
            <p className="text-sm font-bold text-amber-900">
              ระบบจะตั้งรหัสผ่านกลับเป็น Password123! และบังคับให้นักเรียนเปลี่ยนรหัสเมื่อเข้าสู่ระบบ
            </p>
          </div>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber-600 px-4 py-2.5 text-sm font-black text-white hover:bg-amber-700 disabled:opacity-60"
            disabled={resetPending}
          >
            <RotateCcw aria-hidden size={18} />
            {resetPending ? "กำลังรีเซ็ต" : "รีเซ็ตรหัสผ่าน"}
          </button>
          {resetState.message ? (
            <div className="mt-3 rounded-md bg-white px-3 py-2 text-sm font-bold text-slate-700">
              <p>{resetState.message}</p>
              {resetState.initialPassword ? (
                <p className="mt-1 text-base font-black text-amber-800">
                  รหัสผ่านใหม่: {resetState.initialPassword}
                </p>
              ) : null}
            </div>
          ) : null}
        </form>

        <form
          action={deleteAction}
          className="rounded-lg border border-rose-200 bg-rose-50 p-4 shadow-sm"
          onSubmit={(event) => {
            if (
              !window.confirm(
                `ยืนยันลบนักเรียน ${student.fullName} ออกจากระบบหรือไม่`,
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input name="studentProfileId" type="hidden" value={student.id} />
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-lg font-black text-slate-950">ลบนักเรียน</h2>
            <p className="text-sm font-bold text-rose-900">
              ลบได้เฉพาะบัญชีที่ยังไม่มีประวัติแลกขยะ แต้ม หรือเศษคงค้าง หากมีประวัติแล้วระบบจะแจ้งให้ปิดบัญชีแทน
            </p>
          </div>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-rose-700 px-4 py-2.5 text-sm font-black text-white hover:bg-rose-800 disabled:opacity-60"
            disabled={deletePending}
          >
            <Trash2 aria-hidden size={18} />
            {deletePending ? "กำลังลบ" : "ลบนักเรียน"}
          </button>
          {deleteState.message ? (
            <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm font-bold text-rose-700">
              {deleteState.message}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
