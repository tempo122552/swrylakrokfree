import { read, utils } from "xlsx";

export type ImportedStudentRow = {
  studentId: string;
  fullName: string;
  gradeLevel: string;
  classroom: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
};

export type ImportError = {
  rowNumber: number;
  message: string;
};

export const maxStudentImportRows = 1500;

export const studentImportColumnLabels = {
  studentId: "เลขประจำตัวนักเรียน",
  studentIdAlias: "เลขประจำตัว",
  prefix: "คำนำหน้า",
  firstName: "ชื่อ",
  lastName: "นามสกุล",
  fullName: "ชื่อ-นามสกุล",
  gradeLevel: "ชั้น",
  gradeLevelLegacy: "ระดับชั้น",
  room: "ห้อง",
  classroom: "ห้องเรียน",
  initialPassword: "รหัสผ่านเริ่มต้น",
} as const;

export const studentImportPreviewHeaders = [
  studentImportColumnLabels.studentIdAlias,
  studentImportColumnLabels.prefix,
  studentImportColumnLabels.firstName,
  studentImportColumnLabels.lastName,
  studentImportColumnLabels.gradeLevel,
  studentImportColumnLabels.room,
] as const;

export type ImportedStudentAccount = ImportedStudentRow & {
  initialPassword: string;
};

function cellValue(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const raw = row[key];

    if (raw === undefined || raw === null || raw === "") {
      continue;
    }

    if (typeof raw === "number" && Number.isFinite(raw)) {
      return String(raw);
    }

    return String(raw).trim();
  }

  return "";
}

function normalizeStudentId(value: string) {
  return value.trim();
}

function buildFullName(input: {
  prefix: string;
  firstName: string;
  lastName: string;
  legacyFullName: string;
}) {
  if (input.legacyFullName) {
    return input.legacyFullName;
  }

  return [input.prefix, input.firstName, input.lastName].filter(Boolean).join(" ").trim();
}

export function composeClassroom(
  gradeLevel: string,
  room: string,
  legacyClassroom: string,
) {
  if (!room) {
    return legacyClassroom;
  }

  if (room.includes("/")) {
    return room;
  }

  if (/^\d+$/.test(room) && gradeLevel) {
    return `${gradeLevel}/${room}`;
  }

  return room;
}

export function splitRoomForExport(gradeLevel: string, classroom: string) {
  const prefix = `${gradeLevel}/`;

  if (gradeLevel && classroom.startsWith(prefix)) {
    return classroom.slice(prefix.length);
  }

  return classroom;
}

function resolveGradeLevel(
  gradeLevel: string,
  legacyGradeLevel: string,
  classroom: string,
  legacyClassroom: string,
) {
  if (gradeLevel) {
    return gradeLevel;
  }

  if (legacyGradeLevel) {
    return legacyGradeLevel;
  }

  const source = legacyClassroom || classroom;
  const slashIndex = source.lastIndexOf("/");

  if (slashIndex > 0) {
    return source.slice(0, slashIndex);
  }

  return "";
}

export function parseImportedStudentFields(row: Record<string, unknown>) {
  const studentId = normalizeStudentId(
    cellValue(
      row,
      studentImportColumnLabels.studentId,
      studentImportColumnLabels.studentIdAlias,
    ),
  );
  const prefix = cellValue(row, studentImportColumnLabels.prefix);
  const firstName = cellValue(row, studentImportColumnLabels.firstName);
  const lastName = cellValue(row, studentImportColumnLabels.lastName);
  const legacyFullName = cellValue(row, studentImportColumnLabels.fullName);
  const gradeLevel = cellValue(row, studentImportColumnLabels.gradeLevel);
  const legacyGradeLevel = cellValue(
    row,
    studentImportColumnLabels.gradeLevelLegacy,
  );
  const room = cellValue(row, studentImportColumnLabels.room);
  const legacyClassroom = cellValue(row, studentImportColumnLabels.classroom);
  const fullName = buildFullName({
    prefix,
    firstName,
    lastName,
    legacyFullName,
  });
  const resolvedGradeLevel = resolveGradeLevel(
    gradeLevel,
    legacyGradeLevel,
    room,
    legacyClassroom,
  );
  const classroom = composeClassroom(
    resolvedGradeLevel,
    room,
    legacyClassroom,
  );

  const parsed: ImportedStudentRow = {
    studentId,
    fullName,
    gradeLevel: resolvedGradeLevel,
    classroom,
  };

  if (prefix || firstName || lastName) {
    parsed.prefix = prefix;
    parsed.firstName = firstName;
    parsed.lastName = lastName;
  }

  return parsed;
}

export function formatStudentImportPreviewCells(row: ImportedStudentRow) {
  const hasSplitName = Boolean(row.firstName || row.lastName || row.prefix);

  return [
    row.studentId,
    row.prefix ?? "",
    hasSplitName ? (row.firstName ?? "") : row.fullName,
    row.lastName ?? "",
    row.gradeLevel,
    splitRoomForExport(row.gradeLevel, row.classroom),
  ];
}

export function buildStudentImportResultRows(accounts: ImportedStudentAccount[]) {
  return accounts.map((account) => {
    const hasSplitName = Boolean(
      account.firstName || account.lastName || account.prefix,
    );

    return {
      [studentImportColumnLabels.studentId]: account.studentId,
      [studentImportColumnLabels.prefix]: account.prefix ?? "",
      [studentImportColumnLabels.firstName]: hasSplitName
        ? (account.firstName ?? "")
        : account.fullName,
      [studentImportColumnLabels.lastName]: account.lastName ?? "",
      [studentImportColumnLabels.gradeLevel]: account.gradeLevel,
      [studentImportColumnLabels.room]: splitRoomForExport(
        account.gradeLevel,
        account.classroom,
      ),
      [studentImportColumnLabels.initialPassword]: account.initialPassword,
    };
  });
}

export function getStudentImportTemplateRows() {
  return [
    {
      [studentImportColumnLabels.studentId]: "06692",
      [studentImportColumnLabels.prefix]: "เด็กชาย",
      [studentImportColumnLabels.firstName]: "กนกพล",
      [studentImportColumnLabels.lastName]: "ต่างประเสริฐ",
      [studentImportColumnLabels.gradeLevel]: "ม.1",
      [studentImportColumnLabels.room]: "1",
    },
  ];
}

export function parseStudentRows(
  rows: Record<string, unknown>[],
  options: { existingStudentIds?: Set<string> } = {},
) {
  if (rows.length > maxStudentImportRows) {
    return {
      validRows: [] as ImportedStudentRow[],
      errors: [
        {
          rowNumber: 0,
          message: `ไฟล์มีนักเรียนเกิน ${maxStudentImportRows} คน กรุณาแบ่งไฟล์แล้วนำเข้าใหม่`,
        },
      ],
    };
  }

  const validRows: ImportedStudentRow[] = [];
  const errors: ImportError[] = [];
  const seenStudentIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const parsed = parseImportedStudentFields(row);

    if (!parsed.studentId) {
      errors.push({
        rowNumber,
        message: `แถว ${rowNumber}: กรอกเลขประจำตัวนักเรียน`,
      });
      return;
    }

    if (!parsed.fullName || !parsed.gradeLevel || !parsed.classroom) {
      errors.push({
        rowNumber,
        message: `แถว ${rowNumber}: กรอกข้อมูลนักเรียนให้ครบ`,
      });
      return;
    }

    if (seenStudentIds.has(parsed.studentId)) {
      errors.push({
        rowNumber,
        message: `แถว ${rowNumber}: เลขประจำตัวนักเรียนซ้ำในไฟล์`,
      });
      return;
    }

    if (options.existingStudentIds?.has(parsed.studentId)) {
      errors.push({
        rowNumber,
        message: `แถว ${rowNumber}: เลขประจำตัวนักเรียนมีอยู่ในระบบแล้ว`,
      });
      return;
    }

    seenStudentIds.add(parsed.studentId);
    validRows.push(parsed);
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
    raw: false,
  });

  return parseStudentRows(rows, options);
}

export function parseImportPayload(
  payload: string,
  options: { existingStudentIds?: Set<string> } = {},
) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(payload);
  } catch {
    return {
      validRows: [] as ImportedStudentRow[],
      errors: [{ rowNumber: 0, message: "ข้อมูลนำเข้าไม่ถูกต้อง" }],
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      validRows: [] as ImportedStudentRow[],
      errors: [{ rowNumber: 0, message: "ข้อมูลนำเข้าไม่ถูกต้อง" }],
    };
  }

  const rows = parsed.map((item) => {
    const row = item as Record<string, unknown>;

    return {
      [studentImportColumnLabels.studentId]: String(row.studentId ?? ""),
      [studentImportColumnLabels.prefix]: String(row.prefix ?? ""),
      [studentImportColumnLabels.firstName]: String(row.firstName ?? ""),
      [studentImportColumnLabels.lastName]: String(row.lastName ?? ""),
      [studentImportColumnLabels.fullName]: String(row.fullName ?? ""),
      [studentImportColumnLabels.gradeLevel]: String(row.gradeLevel ?? ""),
      [studentImportColumnLabels.gradeLevelLegacy]: String(
        row.gradeLevelLegacy ?? "",
      ),
      [studentImportColumnLabels.room]: String(row.room ?? ""),
      [studentImportColumnLabels.classroom]: String(row.classroom ?? ""),
    };
  });

  return parseStudentRows(rows, options);
}
