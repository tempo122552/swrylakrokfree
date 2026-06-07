import { describe, expect, it } from "vitest";
import {
  buildStudentImportResultRows,
  getStudentImportTemplateRows,
  maxStudentImportRows,
  parseImportPayload,
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

  it("rejects files above the student import limit", () => {
    const rows = Array.from({ length: maxStudentImportRows + 1 }, (_, index) => ({
      "เลขประจำตัวนักเรียน": String(10000 + index),
      "ชื่อ-นามสกุล": `นักเรียน ${index + 1}`,
      "ระดับชั้น": "ม.1",
      "ห้องเรียน": "ม.1/1",
    }));

    const result = parseStudentRows(rows);

    expect(result.validRows).toEqual([]);
    expect(result.errors[0]?.message).toBe(
      `ไฟล์มีนักเรียนเกิน ${maxStudentImportRows} คน กรุณาแบ่งไฟล์แล้วนำเข้าใหม่`,
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

describe("buildStudentImportResultRows", () => {
  it("maps imported student accounts to Excel rows", () => {
    expect(
      buildStudentImportResultRows([
        {
          studentId: "10001",
          fullName: "นักเรียน ตัวอย่าง",
          gradeLevel: "ม.1",
          classroom: "ม.1/1",
          initialPassword: "Password123!",
        },
      ]),
    ).toEqual([
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

describe("parseImportPayload", () => {
  it("parses a JSON payload through the same validation rules", () => {
    const result = parseImportPayload(
      JSON.stringify([
        {
          studentId: "10001",
          fullName: "นักเรียน ทดสอบ",
          gradeLevel: "ม.1",
          classroom: "ม.1/1",
        },
      ]),
    );

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

  it("rejects invalid JSON payloads", () => {
    const result = parseImportPayload("{not-json");

    expect(result.validRows).toEqual([]);
    expect(result.errors[0]?.message).toBe("ข้อมูลนำเข้าไม่ถูกต้อง");
  });
});
