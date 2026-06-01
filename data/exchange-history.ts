import "server-only";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/data/db";
import { requireRole, type CurrentUser } from "@/data/permissions";

type RawHistoryFilters = {
  q?: string | string[];
  classroom?: string | string[];
  dateFrom?: string | string[];
  dateTo?: string | string[];
};

type ExchangeHistoryRecord = {
  id: string;
  createdAt: Date;
  totalPointsEarned: number;
  studentProfile: {
    studentId: string;
    fullName: string;
    classroom: string;
  };
  staffUser: { displayName: string };
  items: Array<{
    itemCount: number;
    pointsEarned: number;
    wasteType: { name: string };
  }>;
};

export type NormalizedTeacherHistoryFilters = {
  q?: string;
  classroom?: string;
  dateFrom?: string;
  dateTo?: string;
  createdAt?: Prisma.DateTimeFilter<"Exchange">;
};

export type TeacherExchangeHistoryRow = {
  id: string;
  createdAt: string;
  studentId: string;
  studentName: string;
  classroom: string;
  staffName: string;
  totalItemCount: number;
  totalPointsEarned: number;
  itemSummary: string;
};

export function buildTeacherExchangeHistoryExportWorkbookData({
  filters,
  rows,
}: {
  filters: Pick<
    NormalizedTeacherHistoryFilters,
    "q" | "classroom" | "dateFrom" | "dateTo"
  >;
  rows: TeacherExchangeHistoryRow[];
}) {
  return {
    summary: [
      { ตัวกรอง: "คำค้นหา", ค่า: filters.q ?? "ทั้งหมด" },
      { ตัวกรอง: "ห้องเรียน", ค่า: filters.classroom ?? "ทุกห้องเรียน" },
      { ตัวกรอง: "ตั้งแต่วันที่", ค่า: filters.dateFrom ?? "ไม่กำหนด" },
      { ตัวกรอง: "ถึงวันที่", ค่า: filters.dateTo ?? "ไม่กำหนด" },
      { ตัวกรอง: "จำนวนรายการ", ค่า: rows.length },
    ],
    exchanges: rows.map((row) => ({
      "วันที่": new Date(row.createdAt).toLocaleString("th-TH"),
      "เลขประจำตัวนักเรียน": row.studentId,
      "ชื่อ-นามสกุล": row.studentName,
      "ห้องเรียน": row.classroom,
      "รายการขยะ": row.itemSummary,
      "จำนวนชิ้น": row.totalItemCount,
      "แต้ม": row.totalPointsEarned,
      "เจ้าหน้าที่": row.staffName,
    })),
  };
}

export function normalizeTeacherExchangeHistoryFilters(
  rawFilters: RawHistoryFilters,
): NormalizedTeacherHistoryFilters {
  const q = firstValue(rawFilters.q)?.trim();
  const classroom = firstValue(rawFilters.classroom)?.trim();
  const dateFrom = normalizeDateInput(firstValue(rawFilters.dateFrom));
  const dateTo = normalizeDateInput(firstValue(rawFilters.dateTo));
  const createdAt: Prisma.DateTimeFilter<"Exchange"> = {};

  if (dateFrom) {
    createdAt.gte = new Date(`${dateFrom}T00:00:00.000+07:00`);
  }

  if (dateTo) {
    createdAt.lte = new Date(`${dateTo}T23:59:59.999+07:00`);
  }

  return {
    ...(q ? { q } : {}),
    ...(classroom ? { classroom } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(createdAt.gte || createdAt.lte ? { createdAt } : {}),
  };
}

export function buildTeacherExchangeHistoryRows(
  exchanges: ExchangeHistoryRecord[],
): TeacherExchangeHistoryRow[] {
  return exchanges.map((exchange) => ({
    id: exchange.id,
    createdAt: exchange.createdAt.toISOString(),
    studentId: exchange.studentProfile.studentId,
    studentName: exchange.studentProfile.fullName,
    classroom: exchange.studentProfile.classroom,
    staffName: exchange.staffUser.displayName,
    totalItemCount: exchange.items.reduce((sum, item) => sum + item.itemCount, 0),
    totalPointsEarned: exchange.totalPointsEarned,
    itemSummary: exchange.items
      .map(
        (item) =>
          `${item.wasteType.name} ${item.itemCount} ชิ้น (${item.pointsEarned} แต้ม)`,
      )
      .join(", "),
  }));
}

export async function getTeacherExchangeHistory(
  currentUser: CurrentUser | null,
  rawFilters: RawHistoryFilters,
) {
  requireRole(currentUser, [UserRole.TEACHER]);

  const filters = normalizeTeacherExchangeHistoryFilters(rawFilters);
  const where: Prisma.ExchangeWhereInput = {
    ...(filters.createdAt ? { createdAt: filters.createdAt } : {}),
    ...(filters.classroom || filters.q
      ? {
          studentProfile: {
            ...(filters.classroom ? { classroom: filters.classroom } : {}),
            ...(filters.q
              ? {
                  OR: [
                    { studentId: { contains: filters.q } },
                    { fullName: { contains: filters.q } },
                  ],
                }
              : {}),
          },
        }
      : {}),
  };

  const [classrooms, exchanges] = await Promise.all([
    prisma.studentProfile.findMany({
      orderBy: [{ gradeLevel: "asc" }, { classroom: "asc" }],
      select: { classroom: true },
    }),
    prisma.exchange.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        studentProfile: {
          select: { studentId: true, fullName: true, classroom: true },
        },
        staffUser: { select: { displayName: true } },
        items: {
          include: { wasteType: { select: { name: true } } },
          orderBy: { wasteType: { name: "asc" } },
        },
      },
    }),
  ]);

  return {
    filters,
    classrooms: Array.from(new Set(classrooms.map((student) => student.classroom))),
    rows: buildTeacherExchangeHistoryRows(exchanges),
  };
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeDateInput(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return undefined;
  }

  const date = new Date(`${trimmed}T00:00:00.000+07:00`);
  return Number.isNaN(date.getTime()) ? undefined : trimmed;
}
