import { read, utils } from "xlsx";

export type ImportedStudentRow = {
  studentId: string;
  fullName: string;
  gradeLevel: string;
  classroom: string;
};

export type ImportError = {
  rowNumber: number;
  message: string;
};

const studentImportColumns = {
  studentId: "เลขประจำตัวนักเรียน",
  fullName: "ชื่อ-นามสกุล",
  gradeLevel: "ระดับชั้น",
  classroom: "ห้องเรียน",
} as const;

function value(row: Record<string, unknown>, key: string) {
  return String(row[key] ?? "").trim();
}

export function getStudentImportTemplateRows() {
  return [
    {
      [studentImportColumns.studentId]: "10001",
      [studentImportColumns.fullName]: "นักเรียน ตัวอย่าง",
      [studentImportColumns.gradeLevel]: "ม.1",
      [studentImportColumns.classroom]: "ม.1/1",
    },
  ];
}

export function parseStudentRows(
  rows: Record<string, unknown>[],
  options: { existingStudentIds?: Set<string> } = {},
) {
  const validRows: ImportedStudentRow[] = [];
  const errors: ImportError[] = [];
  const seenStudentIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const studentId = value(row, studentImportColumns.studentId);
    const fullName = value(row, studentImportColumns.fullName);
    const gradeLevel = value(row, studentImportColumns.gradeLevel);
    const classroom = value(row, studentImportColumns.classroom);

    if (!studentId) {
      errors.push({
        rowNumber,
        message: `แถว ${rowNumber}: กรอกเลขประจำตัวนักเรียน`,
      });
      return;
    }

    if (!fullName || !gradeLevel || !classroom) {
      errors.push({
        rowNumber,
        message: `แถว ${rowNumber}: กรอกข้อมูลนักเรียนให้ครบ`,
      });
      return;
    }

    if (seenStudentIds.has(studentId)) {
      errors.push({
        rowNumber,
        message: `แถว ${rowNumber}: เลขประจำตัวนักเรียนซ้ำในไฟล์`,
      });
      return;
    }

    if (options.existingStudentIds?.has(studentId)) {
      errors.push({
        rowNumber,
        message: `แถว ${rowNumber}: เลขประจำตัวนักเรียนมีอยู่ในระบบแล้ว`,
      });
      return;
    }

    seenStudentIds.add(studentId);
    validRows.push({ studentId, fullName, gradeLevel, classroom });
  });

  return { validRows, errors };
}

export async function parseStudentFile(
  file: File,
  options: { existingStudentIds?: Set<string> } = {},
) {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return {
      validRows: [],
      errors: [{ rowNumber: 0, message: "ไฟล์ไม่มีชีตข้อมูล" }],
    };
  }

  const firstSheet = workbook.Sheets[firstSheetName];
  const rows = utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
  });

  return parseStudentRows(rows, options);
}
