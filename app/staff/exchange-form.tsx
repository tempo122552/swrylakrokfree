"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { createExchangeAction } from "./actions";
import { StudentSearchPicker } from "./student-search-picker";
import type { StudentOption } from "./student-search";

type WasteTypeOption = {
  id: string;
  name: string;
  itemsPerPoint: number;
};

type Row = {
  id: string;
  wasteTypeId: string;
  itemCount: number;
};

export function ExchangeForm({
  students,
  wasteTypes,
}: {
  students: StudentOption[];
  wasteTypes: WasteTypeOption[];
}) {
  const [studentProfileId, setStudentProfileId] = useState(students[0]?.id ?? "");
  const [rows, setRows] = useState<Row[]>([
    { id: crypto.randomUUID(), wasteTypeId: wasteTypes[0]?.id ?? "", itemCount: 1 },
  ]);

  const selectedStudent = students.find((student) => student.id === studentProfileId);
  const previewRows = useMemo(
    () =>
      rows.map((row) => {
        const wasteType = wasteTypes.find((item) => item.id === row.wasteTypeId);
        return {
          ...row,
          wasteTypeName: wasteType?.name ?? "-",
          points: wasteType ? Math.floor(row.itemCount / wasteType.itemsPerPoint) : 0,
          remainder: wasteType ? row.itemCount % wasteType.itemsPerPoint : 0,
        };
      }),
    [rows, wasteTypes],
  );

  return (
    <form
      action={createExchangeAction}
      className="grid items-start gap-6 lg:grid-cols-[1fr_0.8fr]"
    >
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black">บันทึกรายการแลกขยะ</h2>
        <input name="studentProfileId" type="hidden" value={studentProfileId} />
        <div className="mt-4">
          <StudentSearchPicker
            id="student-search"
            onSelect={setStudentProfileId}
            selectedStudentId={studentProfileId}
            students={students}
          />
        </div>
        <div className="mt-5 space-y-3">
          {rows.map((row) => (
            <div
              className="grid gap-3 rounded-lg bg-slate-50 p-3 md:grid-cols-[1fr_140px_auto]"
              key={row.id}
            >
              <select
                className="min-h-11 rounded-md border border-slate-300 px-3 py-2"
                name="wasteTypeId"
                onChange={(event) =>
                  setRows((current) =>
                    current.map((item) =>
                      item.id === row.id
                        ? { ...item, wasteTypeId: event.target.value }
                        : item,
                    ),
                  )
                }
                value={row.wasteTypeId}
              >
                {wasteTypes.map((wasteType) => (
                  <option key={wasteType.id} value={wasteType.id}>
                    {wasteType.name} ({wasteType.itemsPerPoint} ชิ้น/แต้ม)
                  </option>
                ))}
              </select>
              <input
                className="min-h-11 rounded-md border border-slate-300 px-3 py-2"
                min={1}
                name="itemCount"
                onChange={(event) =>
                  setRows((current) =>
                    current.map((item) =>
                      item.id === row.id
                        ? { ...item, itemCount: Number(event.target.value) }
                        : item,
                    ),
                  )
                }
                type="number"
                value={row.itemCount}
              />
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"
                onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                type="button"
              >
                <Trash2 aria-hidden size={16} />
                ลบ
              </button>
            </div>
          ))}
        </div>
        <button
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800 sm:w-auto"
          onClick={() =>
            setRows((current) => [
              ...current,
              { id: crypto.randomUUID(), wasteTypeId: wasteTypes[0]?.id ?? "", itemCount: 1 },
            ])
          }
          type="button"
        >
          <Plus aria-hidden size={16} />
          เพิ่มชนิดขยะ
        </button>
      </section>
      <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-36">
        <h2 className="text-lg font-black">ตรวจทานก่อนยืนยัน</h2>
        <p className="mt-2 text-sm text-slate-600">
          {selectedStudent
            ? `${selectedStudent.studentId} · ${selectedStudent.fullName} · ${selectedStudent.classroom}`
            : "เลือกนักเรียน"}
        </p>
        <div className="mt-4 space-y-3">
          {previewRows.map((row) => (
            <div className="rounded-lg bg-slate-50 p-3" key={row.id}>
              <p className="font-bold">{row.wasteTypeName}</p>
              <p className="text-sm text-slate-600">
                {row.itemCount} ชิ้น · ประมาณ {row.points} แต้ม · เศษ {row.remainder} ชิ้น
              </p>
            </div>
          ))}
        </div>
        <button
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-3 font-black text-white hover:bg-emerald-800 disabled:opacity-60"
          disabled={!selectedStudent}
        >
          <Save aria-hidden size={18} />
          ยืนยันรายการ
        </button>
      </aside>
    </form>
  );
}
