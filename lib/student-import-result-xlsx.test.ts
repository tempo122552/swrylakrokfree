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
        studentId: "06692",
        fullName: "เด็กชาย กนกพล ต่างประเสริฐ",
        gradeLevel: "ม.1",
        classroom: "ม.1/1",
        prefix: "เด็กชาย",
        firstName: "กนกพล",
        lastName: "ต่างประเสริฐ",
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
        "เลขประจำตัวนักเรียน": "06692",
        คำนำหน้า: "เด็กชาย",
        ชื่อ: "กนกพล",
        นามสกุล: "ต่างประเสริฐ",
        ชั้น: "ม.1",
        ห้อง: "1",
        "รหัสผ่านเริ่มต้น": "Password123!",
      },
    ]);
  });
});
