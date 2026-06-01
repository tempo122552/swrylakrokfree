"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { createPointAdjustmentAction } from "../actions";
import type { StudentOption } from "../student-search";
import { StudentSearchPicker } from "../student-search-picker";

type WasteTypeOption = {
  id: string;
  name: string;
};

export function AdjustmentForm({
  students,
  wasteTypes,
}: {
  students: StudentOption[];
  wasteTypes: WasteTypeOption[];
}) {
  const [studentProfileId, setStudentProfileId] = useState(students[0]?.id ?? "");
  const selectedStudent = students.find((student) => student.id === studentProfileId);

  return (
    <form
      action={createPointAdjustmentAction}
      className="grid items-start gap-6 lg:grid-cols-[0.9fr_1fr]"
    >
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-36">
        <h2 className="text-lg font-black">เลือกนักเรียน</h2>
        <input name="studentProfileId" type="hidden" value={studentProfileId} />
        <div className="mt-4">
          <StudentSearchPicker
            id="adjustment-student-search"
            onSelect={setStudentProfileId}
            selectedStudentId={studentProfileId}
            students={students}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black">รายละเอียดการปรับแก้</h2>
        <p className="mt-2 text-sm text-slate-600">
          {selectedStudent
            ? `${selectedStudent.studentId} · ${selectedStudent.fullName} · ${selectedStudent.classroom}`
            : "เลือกนักเรียน"}
        </p>
        <div className="mt-4 grid gap-4">
          <label>
            <span className="text-sm font-bold">แต้มที่ปรับ (+/-)</span>
            <input
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2"
              defaultValue={0}
              name="pointDelta"
              type="number"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-bold">ชนิดขยะที่แก้เศษคงค้าง</span>
              <select
                className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2"
                name="wasteTypeId"
              >
                <option value="">ไม่แก้เศษคงค้าง</option>
                {wasteTypes.map((wasteType) => (
                  <option key={wasteType.id} value={wasteType.id}>
                    {wasteType.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-bold">เศษคงค้างใหม่</span>
              <input
                className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2"
                min={0}
                name="newRemainder"
                type="number"
              />
            </label>
          </div>
          <label>
            <span className="text-sm font-bold">เหตุผล</span>
            <textarea
              className="mt-1 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2"
              name="reason"
              required
            />
          </label>
        </div>
        <button
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-3 font-black text-white disabled:opacity-60 sm:w-auto"
          disabled={!selectedStudent}
        >
          <Save aria-hidden size={18} />
          บันทึกการปรับแก้
        </button>
      </section>
    </form>
  );
}
