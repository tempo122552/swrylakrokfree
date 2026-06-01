"use client";

import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  countStudentSearchMatches,
  filterStudentOptions,
  type StudentOption,
} from "./student-search";

export function StudentSearchPicker({
  id,
  label = "นักเรียน",
  students,
  selectedStudentId,
  onSelect,
}: {
  id: string;
  label?: string;
  students: StudentOption[];
  selectedStudentId: string;
  onSelect: (studentId: string) => void;
}) {
  const [studentQuery, setStudentQuery] = useState("");
  const filteredStudents = useMemo(
    () => filterStudentOptions(students, studentQuery),
    [students, studentQuery],
  );
  const matchingStudentCount = useMemo(
    () => countStudentSearchMatches(students, studentQuery),
    [students, studentQuery],
  );

  return (
    <div>
      <label className="text-sm font-bold" htmlFor={id}>
        {label}
      </label>
      <div className="relative mt-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          className="min-h-11 w-full rounded-md border border-slate-300 py-3 pl-10 pr-3 text-base font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:text-sm"
          id={id}
          onChange={(event) => setStudentQuery(event.target.value)}
          placeholder="เลขประจำตัว ชื่อ หรือห้องเรียน"
          type="search"
          value={studentQuery}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
        <span>พบ {matchingStudentCount.toLocaleString("th-TH")} คน</span>
        {studentQuery ? (
          <button
            className="rounded-md px-2 py-1 text-slate-700 underline-offset-2 hover:underline"
            onClick={() => setStudentQuery("")}
            type="button"
          >
            ล้างคำค้น
          </button>
        ) : null}
      </div>
      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 sm:max-h-80">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => {
            const isSelected = student.id === selectedStudentId;

            return (
              <button
                className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-md border px-3 py-3 text-left text-sm transition ${
                  isSelected
                    ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                    : "border-transparent bg-white text-slate-800 hover:border-slate-300"
                }`}
                key={student.id}
                onClick={() => onSelect(student.id)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate font-black">
                    {student.studentId} · {student.fullName}
                  </span>
                  <span className="block text-xs font-bold text-slate-500">
                    {student.classroom}
                  </span>
                </span>
                {isSelected ? (
                  <Check
                    aria-label="เลือกอยู่"
                    className="shrink-0 text-emerald-700"
                    size={18}
                  />
                ) : null}
              </button>
            );
          })
        ) : (
          <p className="rounded-md bg-white px-3 py-6 text-center text-sm font-bold text-slate-500">
            ไม่พบนักเรียนตามคำค้น
          </p>
        )}
      </div>
    </div>
  );
}
