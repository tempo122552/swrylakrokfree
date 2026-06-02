import "server-only";
import { UserRole } from "@prisma/client";
import { prisma } from "@/data/db";
import { requireRole, type CurrentUser } from "@/data/permissions";

type ExportStudent = {
  studentId: string;
  fullName: string;
  gradeLevel: string;
  classroom: string;
  user: { isActive: boolean; mustChangePassword: boolean };
  exchanges: Array<{ totalPointsEarned: number }>;
  pointAdjustments: Array<{ pointDelta: number }>;
};

type ExportExchange = {
  createdAt: Date;
  totalPointsEarned: number;
  studentProfile: {
    studentId: string;
    fullName: string;
    classroom: string;
  };
  items: Array<{
    wasteType: { name: string };
    itemCount: number;
    pointsEarned: number;
  }>;
};

type ExportRanking = {
  studentId: string;
  fullName: string;
  classroom: string;
  totalPoints: number;
};

type DashboardStudent = {
  classroom: string;
  exchanges: Array<{ createdAt?: Date; totalPointsEarned: number }>;
  pointAdjustments: Array<{ createdAt?: Date; pointDelta: number }>;
};

type DashboardExchange = {
  createdAt: Date;
  totalPointsEarned: number;
};

type DashboardRecentExchange = DashboardExchange & {
  id: string;
  studentProfile: {
    fullName: string;
    classroom: string;
  };
};

type DashboardExchangeItem = {
  itemCount: number;
  wasteType: { name: string };
  exchange: {
    createdAt: Date;
    studentProfile: { classroom: string };
  };
};

export type TeacherDashboardPeriod = {
  mode: "month" | "term";
  label: string;
  startsAt: Date;
  endsAt: Date;
  month?: string;
  termId?: string;
};

type ReportTerm = {
  id: string;
  name: string;
  startsAt: Date;
  endsAt: Date;
  isActive?: boolean;
};

export function buildTeacherExportWorkbookData({
  students,
  exchanges,
  wasteTypeSummary,
  classroomRankings,
}: {
  students: ExportStudent[];
  exchanges: ExportExchange[];
  wasteTypeSummary: Array<{ wasteTypeName: string; itemCount: number }>;
  classroomRankings: ExportRanking[];
}) {
  const rankByClassroom = new Map<string, number>();

  return {
    students: students.map((student) => ({
      "เลขประจำตัวนักเรียน": student.studentId,
      "ชื่อ-นามสกุล": student.fullName,
      "ระดับชั้น": student.gradeLevel,
      "ห้องเรียน": student.classroom,
      "แต้มสะสม":
        student.exchanges.reduce((sum, item) => sum + item.totalPointsEarned, 0) +
        student.pointAdjustments.reduce((sum, item) => sum + item.pointDelta, 0),
      "ต้องเปลี่ยนรหัสผ่าน": student.user.mustChangePassword ? "ใช่" : "ไม่",
      "สถานะ": student.user.isActive ? "ใช้งาน" : "ปิดใช้งาน",
    })),
    exchanges: exchanges.map((exchange) => ({
      "วันที่": exchange.createdAt.toLocaleString("th-TH"),
      "เลขประจำตัวนักเรียน": exchange.studentProfile.studentId,
      "นักเรียน": exchange.studentProfile.fullName,
      "ห้องเรียน": exchange.studentProfile.classroom,
      "แต้ม": exchange.totalPointsEarned,
      "รายการขยะ": exchange.items
        .map(
          (item) =>
            `${item.wasteType.name} ${item.itemCount} ชิ้น (${item.pointsEarned} แต้ม)`,
        )
        .join(", "),
    })),
    wasteTypeSummary: wasteTypeSummary.map((item) => ({
      "ชนิดขยะ": item.wasteTypeName,
      "จำนวนชิ้นรวม": item.itemCount,
    })),
    classroomRankings: classroomRankings.map((student) => {
      const nextRank = (rankByClassroom.get(student.classroom) ?? 0) + 1;
      rankByClassroom.set(student.classroom, nextRank);

      return {
        "อันดับในห้อง": nextRank,
        "เลขประจำตัวนักเรียน": student.studentId,
        "ชื่อ-นามสกุล": student.fullName,
        "ห้องเรียน": student.classroom,
        "แต้มสะสม": student.totalPoints,
      };
    }),
  };
}

const BANGKOK_OFFSET_HOURS = 7;
const BANGKOK_TIME_ZONE = "Asia/Bangkok";
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

function getBangkokYearMonth(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    timeZone: BANGKOK_TIME_ZONE,
    year: "numeric",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";

  return `${year}-${month}`;
}

function monthRange(monthValue: string) {
  if (!MONTH_PATTERN.test(monthValue)) {
    throw new Error("month must use YYYY-MM");
  }

  const [year, month] = monthValue.split("-").map(Number);

  if (month < 1 || month > 12) {
    throw new Error("month must be between 01 and 12");
  }

  return {
    startsAt: new Date(Date.UTC(year, month - 1, 1, -BANGKOK_OFFSET_HOURS)),
    endsAt: new Date(Date.UTC(year, month, 1, -BANGKOK_OFFSET_HOURS)),
    label: new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("th-TH", {
      month: "long",
      timeZone: BANGKOK_TIME_ZONE,
      year: "numeric",
    }),
  };
}

function isValidMonthValue(monthValue: string) {
  if (!MONTH_PATTERN.test(monthValue)) {
    return false;
  }

  const month = Number(monthValue.split("-")[1]);

  return month >= 1 && month <= 12;
}

export function resolveTeacherDashboardPeriod({
  mode,
  month,
  now = new Date(),
  termId,
  terms,
}: {
  mode?: string;
  month?: string;
  now?: Date;
  termId?: string;
  terms: ReportTerm[];
}): TeacherDashboardPeriod {
  if (mode === "term" && terms.length > 0) {
    const activeTerms = terms.filter((term) => term.isActive !== false);
    const selectedTerm =
      activeTerms.find((term) => term.id === termId) ?? activeTerms.at(0) ?? terms.at(0);

    if (selectedTerm) {
      return {
        mode: "term",
        termId: selectedTerm.id,
        label: selectedTerm.name,
        startsAt: selectedTerm.startsAt,
        endsAt: selectedTerm.endsAt,
      };
    }
  }

  const selectedMonth =
    month && isValidMonthValue(month) ? month : getBangkokYearMonth(now);
  const range = monthRange(selectedMonth);

  return {
    mode: "month",
    month: selectedMonth,
    ...range,
  };
}

function isWithinPeriod(date: Date | undefined, period: TeacherDashboardPeriod) {
  return !date || (date >= period.startsAt && date < period.endsAt);
}

function startOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function nextDay(date: Date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return next;
}

function isWithinDay(date: Date, dayStart: Date, dayEnd: Date) {
  return date >= dayStart && date < dayEnd;
}

export function buildTeacherDashboardView({
  students,
  exchanges,
  recentExchanges,
  exchangeItems,
  now = new Date(),
  period,
}: {
  students: DashboardStudent[];
  exchanges: DashboardExchange[];
  recentExchanges: DashboardRecentExchange[];
  exchangeItems: DashboardExchangeItem[];
  now?: Date;
  period?: TeacherDashboardPeriod;
}) {
  const dashboardPeriod =
    period ?? resolveTeacherDashboardPeriod({ now, terms: [], mode: "month" });
  const periodStudents = students.map((student) => ({
    ...student,
    exchanges: student.exchanges.filter((exchange) =>
      isWithinPeriod(exchange.createdAt, dashboardPeriod),
    ),
    pointAdjustments: student.pointAdjustments.filter((adjustment) =>
      isWithinPeriod(adjustment.createdAt, dashboardPeriod),
    ),
  }));
  const periodExchanges = exchanges.filter((exchange) =>
    isWithinPeriod(exchange.createdAt, dashboardPeriod),
  );
  const periodRecentExchanges = recentExchanges.filter((exchange) =>
    isWithinPeriod(exchange.createdAt, dashboardPeriod),
  );
  const periodExchangeItems = exchangeItems.filter((item) =>
    isWithinPeriod(item.exchange.createdAt, dashboardPeriod),
  );
  const totalsByClassroom = new Map<string, { points: number; items: number }>();
  const totalsByWasteType = new Map<string, number>();
  const todayStart = startOfDay(now);
  const todayEnd = nextDay(todayStart);

  for (const student of periodStudents) {
    const points =
      student.exchanges.reduce((sum, item) => sum + item.totalPointsEarned, 0) +
      student.pointAdjustments.reduce((sum, item) => sum + item.pointDelta, 0);
    const current = totalsByClassroom.get(student.classroom) ?? {
      points: 0,
      items: 0,
    };
    current.points += points;
    totalsByClassroom.set(student.classroom, current);
  }

  for (const item of periodExchangeItems) {
    const classroomTotal = totalsByClassroom.get(
      item.exchange.studentProfile.classroom,
    ) ?? {
      points: 0,
      items: 0,
    };
    classroomTotal.items += item.itemCount;
    totalsByClassroom.set(item.exchange.studentProfile.classroom, classroomTotal);
    totalsByWasteType.set(
      item.wasteType.name,
      (totalsByWasteType.get(item.wasteType.name) ?? 0) + item.itemCount,
    );
  }

  const classroomBars = Array.from(totalsByClassroom.entries()).map(
    ([classroom, totals]) => ({
      classroom,
      points: totals.points,
      items: totals.items,
    }),
  );
  const wasteTypePie = Array.from(totalsByWasteType.entries()).map(
    ([wasteTypeName, itemCount]) => ({
      wasteTypeName,
      itemCount,
    }),
  );
  const todayExchanges = periodExchanges.filter((exchange) =>
    isWithinDay(exchange.createdAt, todayStart, todayEnd),
  );
  const todayItems = periodExchangeItems.filter((item) =>
    isWithinDay(item.exchange.createdAt, todayStart, todayEnd),
  );

  return {
    period: dashboardPeriod,
    totals: {
      students: students.length,
      exchanges: periodExchanges.length,
      points: periodStudents.reduce(
        (sum, student) =>
          sum +
          student.exchanges.reduce(
            (studentSum, item) => studentSum + item.totalPointsEarned,
            0,
          ) +
          student.pointAdjustments.reduce(
            (studentSum, item) => studentSum + item.pointDelta,
            0,
          ),
        0,
      ),
      itemCount: periodExchangeItems.reduce((sum, item) => sum + item.itemCount, 0),
    },
    highlights: {
      today: {
        exchangeCount: todayExchanges.length,
        points: todayExchanges.reduce(
          (sum, exchange) => sum + exchange.totalPointsEarned,
          0,
        ),
        itemCount: todayItems.reduce((sum, item) => sum + item.itemCount, 0),
      },
      topClassroom:
        classroomBars
          .toSorted((a, b) =>
            b.items === a.items ? b.points - a.points : b.items - a.items,
          )
          .at(0) ?? null,
      topWasteType:
        wasteTypePie.toSorted((a, b) => b.itemCount - a.itemCount).at(0) ?? null,
    },
    classroomBars,
    wasteTypePie,
    recentExchanges: periodRecentExchanges.map((exchange) => ({
      id: exchange.id,
      studentName: exchange.studentProfile.fullName,
      classroom: exchange.studentProfile.classroom,
      totalPointsEarned: exchange.totalPointsEarned,
      createdAt: exchange.createdAt.toISOString(),
    })),
  };
}

export type TeacherDashboardFilters = {
  mode?: string;
  month?: string;
  termId?: string;
};

export async function getTeacherDashboard(
  currentUser: CurrentUser | null,
  filters: TeacherDashboardFilters = {},
) {
  requireRole(currentUser, [UserRole.TEACHER]);

  const terms = await prisma.academicTerm.findMany({
    where: { isActive: true },
    orderBy: [{ startsAt: "desc" }, { name: "asc" }],
  });
  const period = resolveTeacherDashboardPeriod({
    mode: filters.mode,
    month: filters.month,
    termId: filters.termId,
    terms,
  });
  const createdAt = {
    gte: period.startsAt,
    lt: period.endsAt,
  };
  const [students, exchanges, recentExchanges, exchangeItems] = await Promise.all([
    prisma.studentProfile.findMany({
      include: {
        exchanges: {
          where: { createdAt },
          select: { createdAt: true, totalPointsEarned: true },
        },
        pointAdjustments: {
          where: { createdAt },
          select: { createdAt: true, pointDelta: true },
        },
      },
    }),
    prisma.exchange.findMany({
      where: { createdAt },
      select: { createdAt: true, totalPointsEarned: true },
    }),
    prisma.exchange.findMany({
      where: { createdAt },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { studentProfile: true },
    }),
    prisma.exchangeItem.findMany({
      where: { exchange: { createdAt } },
      include: {
        wasteType: true,
        exchange: { include: { studentProfile: true } },
      },
    }),
  ]);

  const dashboard = buildTeacherDashboardView({
    students,
    exchanges,
    recentExchanges,
    exchangeItems,
    period,
  });

  return {
    ...dashboard,
    availableTerms: terms.map((term) => ({
      id: term.id,
      name: term.name,
      startsAt: term.startsAt.toISOString(),
      endsAt: term.endsAt.toISOString(),
    })),
  };
}

export async function getTeacherExportWorkbookData(currentUser: CurrentUser | null) {
  requireRole(currentUser, [UserRole.TEACHER]);

  const [students, exchanges, exchangeItems, classroomRankings] = await Promise.all([
    prisma.studentProfile.findMany({
      orderBy: [{ gradeLevel: "asc" }, { classroom: "asc" }, { studentId: "asc" }],
      include: {
        user: { select: { isActive: true, mustChangePassword: true } },
        exchanges: { select: { totalPointsEarned: true } },
        pointAdjustments: { select: { pointDelta: true } },
      },
    }),
    prisma.exchange.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        studentProfile: true,
        items: { include: { wasteType: true } },
      },
    }),
    prisma.exchangeItem.findMany({
      include: { wasteType: true },
    }),
    getClassroomRankings(currentUser),
  ]);

  const totalsByWasteType = new Map<string, number>();

  for (const item of exchangeItems) {
    totalsByWasteType.set(
      item.wasteType.name,
      (totalsByWasteType.get(item.wasteType.name) ?? 0) + item.itemCount,
    );
  }

  return buildTeacherExportWorkbookData({
    students,
    exchanges,
    wasteTypeSummary: Array.from(totalsByWasteType.entries()).map(
      ([wasteTypeName, itemCount]) => ({
        wasteTypeName,
        itemCount,
      }),
    ),
    classroomRankings,
  });
}

export async function getClassroomRankings(currentUser: CurrentUser | null) {
  requireRole(currentUser, [UserRole.TEACHER]);

  const students = await prisma.studentProfile.findMany({
    include: {
      exchanges: { select: { totalPointsEarned: true } },
      pointAdjustments: { select: { pointDelta: true } },
    },
  });

  return students
    .map((student) => ({
      id: student.id,
      studentId: student.studentId,
      fullName: student.fullName,
      classroom: student.classroom,
      totalPoints:
        student.exchanges.reduce((sum, item) => sum + item.totalPointsEarned, 0) +
        student.pointAdjustments.reduce((sum, item) => sum + item.pointDelta, 0),
    }))
    .sort((a, b) =>
      a.classroom === b.classroom
        ? b.totalPoints - a.totalPoints
        : a.classroom.localeCompare(b.classroom, "th"),
    );
}
