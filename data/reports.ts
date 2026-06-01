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
  exchanges: Array<{ totalPointsEarned: number }>;
  pointAdjustments: Array<{ pointDelta: number }>;
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
}: {
  students: DashboardStudent[];
  exchanges: DashboardExchange[];
  recentExchanges: DashboardRecentExchange[];
  exchangeItems: DashboardExchangeItem[];
  now?: Date;
}) {
  const totalsByClassroom = new Map<string, { points: number; items: number }>();
  const totalsByWasteType = new Map<string, number>();
  const todayStart = startOfDay(now);
  const todayEnd = nextDay(todayStart);

  for (const student of students) {
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

  for (const item of exchangeItems) {
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
  const todayExchanges = exchanges.filter((exchange) =>
    isWithinDay(exchange.createdAt, todayStart, todayEnd),
  );
  const todayItems = exchangeItems.filter((item) =>
    isWithinDay(item.exchange.createdAt, todayStart, todayEnd),
  );

  return {
    totals: {
      students: students.length,
      exchanges: exchanges.length,
      points: students.reduce(
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
      itemCount: exchangeItems.reduce((sum, item) => sum + item.itemCount, 0),
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
    recentExchanges: recentExchanges.map((exchange) => ({
      id: exchange.id,
      studentName: exchange.studentProfile.fullName,
      classroom: exchange.studentProfile.classroom,
      totalPointsEarned: exchange.totalPointsEarned,
      createdAt: exchange.createdAt.toISOString(),
    })),
  };
}

export async function getTeacherDashboard(currentUser: CurrentUser | null) {
  requireRole(currentUser, [UserRole.TEACHER]);

  const [students, exchanges, recentExchanges, exchangeItems] = await Promise.all([
    prisma.studentProfile.findMany({
      include: {
        exchanges: { select: { totalPointsEarned: true } },
        pointAdjustments: { select: { pointDelta: true } },
      },
    }),
    prisma.exchange.findMany({
      select: { createdAt: true, totalPointsEarned: true },
    }),
    prisma.exchange.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { studentProfile: true },
    }),
    prisma.exchangeItem.findMany({
      include: {
        wasteType: true,
        exchange: { include: { studentProfile: true } },
      },
    }),
  ]);

  return buildTeacherDashboardView({
    students,
    exchanges,
    recentExchanges,
    exchangeItems,
  });
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
