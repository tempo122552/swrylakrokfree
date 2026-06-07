import { describe, expect, it } from "vitest";
import {
  buildStudentImportResultRows,
  composeClassroom,
  formatStudentImportPreviewCells,
  getStudentImportTemplateRows,
  maxStudentImportRows,
  parseImportPayload,
  parseImportedStudentFields,
  parseStudentRows,
  splitRoomForExport,
} from "./import-students";

describe("parseImportedStudentFields", () => {
  it("parses the six-column school import format", () => {
    const parsed = parseImportedStudentFields({
      "เลขประจำตัว": "06692",
      คำนำหน้า: "เด็กชาย",
      ชื่อ: "กนกพล",
      นามสกุล: "ต่างประเสริฐ",
      ชั้น: "ม.1",
      ห้อง: "1",
    });

    expect(parsed).toEqual({
      studentId: "06692",
      fullName: "เด็กชาย กนกพล ต่างประเสริฐ",
      gradeLevel: "ม.1",
      classroom: "ม.1/1",
      prefix: "เด็กชาย",
      firstName: "กนกพล",
      lastName: "ต่างประเสริฐ",
    });
  });

  it("parses the legacy import format", () => {
    const parsed = parseImportedStudentFields({
      "เลขประจำตัวนักเรียน": "10001",
      "ชื่อ-นามสกุล": "นักเรียน ทดสอบ",
      "ระดับชั้น": "ม.1",
      "ห้องเรียน": "ม.1/1",
    });

    expect(parsed).toEqual({
      studentId: "10001",
      fullName: "นักเรียน ทดสอบ",
      gradeLevel: "ม.1",
      classroom: "ม.1/1",
    });
  });

  it("keeps a room value that already contains a slash", () => {
    expect(composeClassroom("ม.1", "1/1", "")).toBe("1/1");
  });
});

describe("parseStudentRows", () => {
  it("parses required student columns in the new format", () => {
    const result = parseStudentRows([
      {
        "เลขประจำตัวนักเรียน": "10001",
        คำนำหน้า: "เด็กหญิง",
        ชื่อ: "นักเรียน",
        นามสกุล: "ทดสอบ",
        ชั้น: "ม.1",
        ห้อง: "1",
      },
    ]);

    expect(result.validRows).toEqual([
      {
        studentId: "10001",
        fullName: "เด็กหญิง นักเรียน ทดสอบ",
        gradeLevel: "ม.1",
        classroom: "ม.1/1",
        prefix: "เด็กหญิง",
        firstName: "นักเรียน",
        lastName: "ทดสอบ",
      },
    ]);
    expect(result.errors).toEqual([]);
  });

  it("reports missing student IDs", () => {
    const result = parseStudentRows([
      {
        "เลขประจำตัวนักเรียน": "",
        ชื่อ: "นักเรียน",
        นามสกุล: "ทดสอบ",
        ชั้น: "ม.1",
        ห้อง: "1",
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
        ชื่อ: "นักเรียน",
        นามสกุล: "หนึ่ง",
        ชั้น: "ม.1",
        ห้อง: "1",
      },
      {
        "เลขประจำตัวนักเรียน": "10001",
        ชื่อ: "นักเรียน",
        นามสกุล: "สอง",
        ชั้น: "ม.1",
        ห้อง: "1",
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
          ชื่อ: "นักเรียน",
          นามสกุล: "ทดสอบ",
          ชั้น: "ม.1",
          ห้อง: "1",
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
      ชื่อ: `นักเรียน ${index + 1}`,
      นามสกุล: "ทดสอบ",
      ชั้น: "ม.1",
      ห้อง: "1",
    }));

    const result = parseStudentRows(rows);

    expect(result.validRows).toEqual([]);
    expect(result.errors[0]?.message).toBe(
      `ไฟล์มีนักเรียนเกิน ${maxStudentImportRows} คน กรุณาแบ่งไฟล์แล้วนำเข้าใหม่`,
    );
  });

  it("builds a readable student import template row", () => {
    expect(getStudentImportTemplateRows()[0]).toEqual({
      "เลขประจำตัวนักเรียน": "06692",
      คำนำหน้า: "เด็กชาย",
      ชื่อ: "กนกพล",
      นามสกุล: "ต่างประเสริฐ",
      ชั้น: "ม.1",
      ห้อง: "1",
    });
  });
});

describe("buildStudentImportResultRows", () => {
  it("maps imported student accounts to Excel rows", () => {
    expect(
      buildStudentImportResultRows([
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
      ]),
    ).toEqual([
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

describe("formatStudentImportPreviewCells", () => {
  it("splits classroom back into grade and room for preview", () => {
    expect(
      formatStudentImportPreviewCells({
        studentId: "06692",
        fullName: "เด็กชาย กนกพล ต่างประเสริฐ",
        gradeLevel: "ม.1",
        classroom: "ม.1/1",
        prefix: "เด็กชาย",
        firstName: "กนกพล",
        lastName: "ต่างประเสริฐ",
      }),
    ).toEqual(["06692", "เด็กชาย", "กนกพล", "ต่างประเสริฐ", "ม.1", "1"]);
  });

  it("uses the combined full name for legacy rows", () => {
    expect(
      formatStudentImportPreviewCells({
        studentId: "10001",
        fullName: "นักเรียน ทดสอบ",
        gradeLevel: "ม.1",
        classroom: "ม.1/1",
      }),
    ).toEqual(["10001", "", "นักเรียน ทดสอบ", "", "ม.1", "1"]);
  });
});

describe("splitRoomForExport", () => {
  it("removes the grade prefix from a composed classroom", () => {
    expect(splitRoomForExport("ม.1", "ม.1/1")).toBe("1");
  });
});

describe("parseImportPayload", () => {
  it("parses a JSON payload through the same validation rules", () => {
    const result = parseImportPayload(
      JSON.stringify([
        {
          studentId: "10001",
          prefix: "เด็กชาย",
          firstName: "นักเรียน",
          lastName: "ทดสอบ",
          gradeLevel: "ม.1",
          classroom: "ม.1/1",
        },
      ]),
    );

    expect(result.validRows).toEqual([
      {
        studentId: "10001",
        fullName: "เด็กชาย นักเรียน ทดสอบ",
        gradeLevel: "ม.1",
        classroom: "ม.1/1",
        prefix: "เด็กชาย",
        firstName: "นักเรียน",
        lastName: "ทดสอบ",
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
