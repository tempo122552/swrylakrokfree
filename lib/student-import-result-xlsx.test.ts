import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import {
  buildStudentImportResultFilename,
  buildStudentImportResultWorkbook,
  studentImportResultSheetName,
} from "./student-import-result-xlsx";

describe("buildStudentImportResultFilename", () => {
  it("uses a Thai filename with the export date", () => {
    expect(
      buildStudentImportResultFilename(new Date("2026-06-07T10:00:00.000Z")),
    ).toBe("บัญชีนักเรียน-20260607.xlsx");
  });
});

describe("buildStudentImportResultWorkbook", () => {
  it("builds an Excel sheet with student account columns", () => {
    const workbook = buildStudentImportResultWorkbook([
      {
        studentId: "10001",
        fullName: "นักเรียน ตัวอย่าง",
        gradeLevel: "ม.1",
        classroom: "ม.1/1",
        initialPassword: "Password123!",
      },
    ]);
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const parsed = XLSX.read(buffer, { type: "array" });
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(
      parsed.Sheets[studentImportResultSheetName],
    );

    expect(parsed.SheetNames).toEqual([studentImportResultSheetName]);
    expect(rows).toEqual([
      {
        "เลขประจำตัวนักเรียน": "10001",
        "ชื่อ-นามสกุล": "นักเรียน ตัวอย่าง",
        "ระดับชั้น": "ม.1",
        "ห้องเรียน": "ม.1/1",
        "รหัสผ่านเริ่มต้น": "Password123!",
      },
    ]);
  });
});
