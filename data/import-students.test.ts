import { describe, expect, it } from "vitest";
import {
  getStudentImportTemplateRows,
  parseStudentRows,
} from "./import-students";

describe("parseStudentRows", () => {
  it("parses required student columns", () => {
    const result = parseStudentRows([
      {
        "เลขประจำตัวนักเรียน": "10001",
        "ชื่อ-นามสกุล": "นักเรียน ทดสอบ",
        "ระดับชั้น": "ม.1",
        "ห้องเรียน": "ม.1/1",
      },
    ]);

    expect(result.validRows).toEqual([
      {
        studentId: "10001",
        fullName: "นักเรียน ทดสอบ",
        gradeLevel: "ม.1",
        classroom: "ม.1/1",
      },
    ]);
    expect(result.errors).toEqual([]);
  });

  it("reports missing student IDs", () => {
    const result = parseStudentRows([
      {
        "เลขประจำตัวนักเรียน": "",
        "ชื่อ-นามสกุล": "นักเรียน ทดสอบ",
        "ระดับชั้น": "ม.1",
        "ห้องเรียน": "ม.1/1",
      },
    ]);

    expect(result.validRows).toEqual([]);
    expect(result.errors[0]?.message).toBe(
      "แถว 1: กรอกเลขประจำตัวนักเรียน",
    );
  });

  it("reports duplicate student IDs inside the file", () => {
    const result = parseStudentRows([
      {
        "เลขประจำตัวนักเรียน": "10001",
        "ชื่อ-นามสกุล": "นักเรียน หนึ่ง",
        "ระดับชั้น": "ม.1",
        "ห้องเรียน": "ม.1/1",
      },
      {
        "เลขประจำตัวนักเรียน": "10001",
        "ชื่อ-นามสกุล": "นักเรียน สอง",
        "ระดับชั้น": "ม.1",
        "ห้องเรียน": "ม.1/1",
      },
    ]);

    expect(result.validRows).toHaveLength(1);
    expect(result.errors[0]?.message).toBe(
      "แถว 2: เลขประจำตัวนักเรียนซ้ำในไฟล์",
    );
  });

  it("reports student IDs that already exist in the system", () => {
    const result = parseStudentRows(
      [
        {
          "เลขประจำตัวนักเรียน": "10001",
          "ชื่อ-นามสกุล": "นักเรียน ทดสอบ",
          "ระดับชั้น": "ม.1",
          "ห้องเรียน": "ม.1/1",
        },
      ],
      { existingStudentIds: new Set(["10001"]) },
    );

    expect(result.validRows).toEqual([]);
    expect(result.errors[0]?.message).toBe(
      "แถว 1: เลขประจำตัวนักเรียนมีอยู่ในระบบแล้ว",
    );
  });

  it("builds a readable student import template row", () => {
    expect(getStudentImportTemplateRows()[0]).toEqual({
      "เลขประจำตัวนักเรียน": "10001",
      "ชื่อ-นามสกุล": "นักเรียน ตัวอย่าง",
      "ระดับชั้น": "ม.1",
      "ห้องเรียน": "ม.1/1",
    });
  });
});
