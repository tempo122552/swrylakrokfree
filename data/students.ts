import "server-only";
import { UserRole, type Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/data/db";
import type { ImportedStudentRow } from "@/data/import-students";
import { requireRole, type CurrentUser } from "@/data/permissions";
import {
  defaultStudentInitialPassword,
  hashPassword,
} from "@/lib/auth/passwords";

function totalFromParts(
  exchanges: Array<{ totalPointsEarned: number }>,
  adjustments: Array<{ pointDelta: number }>,
) {
  return (
    exchanges.reduce((sum, item) => sum + item.totalPointsEarned, 0) +
    adjustments.reduce((sum, item) => sum + item.pointDelta, 0)
  );
}

const teacherStudentUpdateSchema = z.object({
  studentId: z
    .string()
    .trim()
    .min(1, "กรอกเลขประจำตัวนักเรียน")
    .max(32, "เลขประจำตัวนักเรียนยาวเกินไป")
    .refine((value) => !/\s/.test(value), "เลขประจำตัวนักเรียนต้องไม่มีช่องว่าง"),
  fullName: z.string().trim().min(1, "กรอกชื่อ-นามสกุล"),
  gradeLevel: z.string().trim().min(1, "กรอกระดับชั้น"),
  classroom: z.string().trim().min(1, "กรอกห้องเรียน"),
  isActive: z.boolean(),
});

const teacherStudentStatusFilters = [
  "all",
  "active",
  "inactive",
  "must_change_password",
  "password_changed",
] as const;
export const teacherStudentPageSizeOptions = [10, 25, 50, 100] as const;
export const defaultTeacherStudentPageSize = 25;

export type TeacherStudentStatusFilter =
  (typeof teacherStudentStatusFilters)[number];
export type TeacherStudentPageSize =
  (typeof teacherStudentPageSizeOptions)[number];

export type TeacherStudentListFilters = {
  q: string;
  classroom: string;
  status: TeacherStudentStatusFilter;
  page: number;
  pageSize: TeacherStudentPageSize;
};

export type TeacherStudentUpdateInput = z.input<typeof teacherStudentUpdateSchema>;

function firstSearchValue(value: unknown) {
  if (Array.isArray(value)) {
    return String(value[0] ?? "");
  }

  return String(value ?? "");
}

function positiveIntegerFromSearchValue(value: unknown, fallback: number) {
  const parsed = Number.parseInt(firstSearchValue(value), 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseTeacherStudentListFilters(input: {
  q?: unknown;
  classroom?: unknown;
  status?: unknown;
  page?: unknown;
  pageSize?: unknown;
}): TeacherStudentListFilters {
  const status = firstSearchValue(input.status);
  const requestedPageSize = positiveIntegerFromSearchValue(
    input.pageSize,
    defaultTeacherStudentPageSize,
  );

  return {
    q: firstSearchValue(input.q).trim(),
    classroom: firstSearchValue(input.classroom).trim(),
    status: teacherStudentStatusFilters.includes(
      status as TeacherStudentStatusFilter,
    )
      ? (status as TeacherStudentStatusFilter)
      : "all",
    page: positiveIntegerFromSearchValue(input.page, 1),
    pageSize: teacherStudentPageSizeOptions.includes(
      requestedPageSize as TeacherStudentPageSize,
    )
      ? (requestedPageSize as TeacherStudentPageSize)
      : defaultTeacherStudentPageSize,
  };
}

export function parseTeacherStudentUpdateInput(input: TeacherStudentUpdateInput) {
  const parsed = teacherStudentUpdateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลนักเรียนไม่ถูกต้อง");
  }

  return parsed.data;
}

type TeacherStudentProfileRecord = {
  id: string;
  studentId: string;
  fullName: string;
  gradeLevel: string;
  classroom: string;
  user: {
    loginName: string;
    isActive: boolean;
    mustChangePassword: boolean;
  };
  remainders: Array<{
    itemCount: number;
    wasteType: { name: string; itemsPerPoint: number };
  }>;
  exchanges: Array<{
    id: string;
    createdAt: Date;
    totalPointsEarned: number;
    staffUser: { displayName: string };
    items: Array<{
      itemCount: number;
      pointsEarned: number;
      wasteType: { name: string };
    }>;
  }>;
  pointAdjustments: Array<{
    id: string;
    createdAt: Date;
    pointDelta: number;
    reason: string;
    relatedExchangeId: string | null;
    createdByUser: { displayName: string };
  }>;
};

export function buildTeacherStudentProfileView(
  profile: TeacherStudentProfileRecord,
) {
  return {
    student: {
      id: profile.id,
      studentId: profile.studentId,
      fullName: profile.fullName,
      gradeLevel: profile.gradeLevel,
      classroom: profile.classroom,
      loginName: profile.user.loginName,
      isActive: profile.user.isActive,
      mustChangePassword: profile.user.mustChangePassword,
    },
    totals: {
      points: totalFromParts(profile.exchanges, profile.pointAdjustments),
      exchangeCount: profile.exchanges.length,
      adjustmentCount: profile.pointAdjustments.length,
      remainderItemCount: profile.remainders.reduce(
        (sum, remainder) => sum + remainder.itemCount,
        0,
      ),
    },
    remainders: profile.remainders
      .map((remainder) => ({
        wasteTypeName: remainder.wasteType.name,
        itemCount: remainder.itemCount,
        itemsPerPoint: remainder.wasteType.itemsPerPoint,
        itemsUntilNextPoint:
          remainder.itemCount === 0
            ? 0
            : remainder.wasteType.itemsPerPoint - remainder.itemCount,
      }))
      .sort((a, b) => a.wasteTypeName.localeCompare(b.wasteTypeName, "th")),
    recentExchanges: profile.exchanges.map((exchange) => ({
      id: exchange.id,
      createdAt: exchange.createdAt.toISOString(),
      staffName: exchange.staffUser.displayName,
      totalItemCount: exchange.items.reduce((sum, item) => sum + item.itemCount, 0),
      totalPointsEarned: exchange.totalPointsEarned,
      itemSummary: exchange.items
        .map(
          (item) =>
            `${item.wasteType.name} ${item.itemCount} ชิ้น (${item.pointsEarned} แต้ม)`,
        )
        .join(", "),
    })),
    recentAdjustments: profile.pointAdjustments.map((adjustment) => ({
      id: adjustment.id,
      createdAt: adjustment.createdAt.toISOString(),
      pointDelta: adjustment.pointDelta,
      reason: adjustment.reason,
      relatedExchangeId: adjustment.relatedExchangeId,
      createdByName: adjustment.createdByUser.displayName,
    })),
  };
}

export async function listStudentsForSelection(currentUser: CurrentUser | null) {
  requireRole(currentUser, [UserRole.STAFF, UserRole.TEACHER]);

  return prisma.studentProfile.findMany({
    orderBy: [{ classroom: "asc" }, { studentId: "asc" }],
    select: {
      id: true,
      studentId: true,
      fullName: true,
      gradeLevel: true,
      classroom: true,
    },
  });
}

export async function getStudentDashboard(currentUser: CurrentUser | null) {
  const user = requireRole(currentUser, [UserRole.STUDENT]);

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      remainders: { include: { wasteType: true } },
      exchanges: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { items: { include: { wasteType: true } } },
      },
      pointAdjustments: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });

  if (!profile) {
    throw new Error("Student profile not found");
  }

  const classmates = await prisma.studentProfile.findMany({
    where: { classroom: profile.classroom },
    select: {
      id: true,
      exchanges: { select: { totalPointsEarned: true } },
      pointAdjustments: { select: { pointDelta: true } },
    },
  });

  const ranked = classmates
    .map((classmate) => ({
      id: classmate.id,
      total: totalFromParts(classmate.exchanges, classmate.pointAdjustments),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    student: {
      id: profile.id,
      studentId: profile.studentId,
      fullName: profile.fullName,
      gradeLevel: profile.gradeLevel,
      classroom: profile.classroom,
    },
    totalPoints: totalFromParts(profile.exchanges, profile.pointAdjustments),
    classroomRank: ranked.findIndex((item) => item.id === profile.id) + 1,
    classroomSize: ranked.length,
    remainders: profile.remainders.map((remainder) => ({
      wasteTypeName: remainder.wasteType.name,
      itemCount: remainder.itemCount,
      itemsPerPoint: remainder.wasteType.itemsPerPoint,
    })),
    recentExchanges: profile.exchanges.map((exchange) => ({
      id: exchange.id,
      createdAt: exchange.createdAt.toISOString(),
      totalPointsEarned: exchange.totalPointsEarned,
      items: exchange.items.map((item) => ({
        wasteTypeName: item.wasteType.name,
        itemCount: item.itemCount,
        pointsEarned: item.pointsEarned,
        newRemainder: item.newRemainder,
      })),
    })),
    recentAdjustments: profile.pointAdjustments.map((adjustment) => ({
      id: adjustment.id,
      pointDelta: adjustment.pointDelta,
      reason: adjustment.reason,
      createdAt: adjustment.createdAt.toISOString(),
    })),
  };
}

export async function listStudentsForTeacher(currentUser: CurrentUser | null) {
  return listAllStudentsForTeacherWithFilters(currentUser, {
    q: "",
    classroom: "",
    status: "all",
  });
}

export async function listStudentsForTeacherWithFilters(
  currentUser: CurrentUser | null,
  filters: TeacherStudentListFilters,
) {
  requireRole(currentUser, [UserRole.TEACHER]);

  const where = buildTeacherStudentWhere(filters);
  const total = await prisma.studentProfile.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const students = await prisma.studentProfile.findMany({
    where,
    skip: (page - 1) * filters.pageSize,
    take: filters.pageSize,
    orderBy: [{ gradeLevel: "asc" }, { classroom: "asc" }, { studentId: "asc" }],
    select: {
      id: true,
      studentId: true,
      fullName: true,
      gradeLevel: true,
      classroom: true,
      user: { select: { isActive: true, mustChangePassword: true } },
    },
  });
  const startIndex = total === 0 ? 0 : (page - 1) * filters.pageSize + 1;

  return {
    students,
    total,
    page,
    pageSize: filters.pageSize,
    totalPages,
    startIndex,
    endIndex: startIndex === 0 ? 0 : startIndex + students.length - 1,
  };
}

async function listAllStudentsForTeacherWithFilters(
  currentUser: CurrentUser | null,
  filters: Pick<TeacherStudentListFilters, "q" | "classroom" | "status">,
) {
  requireRole(currentUser, [UserRole.TEACHER]);

  const where = buildTeacherStudentWhere({
    ...filters,
    page: 1,
    pageSize: defaultTeacherStudentPageSize,
  });

  return prisma.studentProfile.findMany({
    where,
    orderBy: [{ gradeLevel: "asc" }, { classroom: "asc" }, { studentId: "asc" }],
    select: {
      id: true,
      studentId: true,
      fullName: true,
      gradeLevel: true,
      classroom: true,
      user: { select: { isActive: true, mustChangePassword: true } },
    },
  });
}

export async function listStudentClassroomsForTeacher(
  currentUser: CurrentUser | null,
) {
  requireRole(currentUser, [UserRole.TEACHER]);

  const students = await prisma.studentProfile.findMany({
    orderBy: [{ gradeLevel: "asc" }, { classroom: "asc" }],
    select: { classroom: true },
  });

  return Array.from(new Set(students.map((student) => student.classroom)));
}

function buildTeacherStudentWhere(filters: TeacherStudentListFilters) {
  const and: Prisma.StudentProfileWhereInput[] = [];

  if (filters.q) {
    and.push({
      OR: [
        { studentId: { contains: filters.q } },
        { fullName: { contains: filters.q } },
      ],
    });
  }

  if (filters.classroom) {
    and.push({ classroom: filters.classroom });
  }

  if (filters.status === "active") {
    and.push({ user: { is: { isActive: true } } });
  }

  if (filters.status === "inactive") {
    and.push({ user: { is: { isActive: false } } });
  }

  if (filters.status === "must_change_password") {
    and.push({ user: { is: { mustChangePassword: true } } });
  }

  if (filters.status === "password_changed") {
    and.push({ user: { is: { mustChangePassword: false } } });
  }

  return and.length > 0 ? { AND: and } : undefined;
}

export async function getTeacherStudentProfile(
  currentUser: CurrentUser | null,
  studentId: string,
) {
  requireRole(currentUser, [UserRole.TEACHER]);

  const profile = await prisma.studentProfile.findUnique({
    where: { studentId },
    include: {
      user: {
        select: {
          loginName: true,
          isActive: true,
          mustChangePassword: true,
        },
      },
      remainders: {
        include: { wasteType: true },
      },
      exchanges: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          staffUser: { select: { displayName: true } },
          items: { include: { wasteType: true } },
        },
      },
      pointAdjustments: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          createdByUser: { select: { displayName: true } },
        },
      },
    },
  });

  return profile ? buildTeacherStudentProfileView(profile) : null;
}

export async function updateTeacherStudentProfile(
  currentUser: CurrentUser | null,
  studentProfileId: string,
  input: TeacherStudentUpdateInput,
) {
  requireRole(currentUser, [UserRole.TEACHER]);

  const parsed = parseTeacherStudentUpdateInput(input);
  const profile = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    select: { id: true, studentId: true, userId: true },
  });

  if (!profile) {
    throw new Error("ไม่พบนักเรียนที่ต้องการแก้ไข");
  }

  if (parsed.studentId !== profile.studentId) {
    const [studentIdOwner, loginOwner] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { studentId: parsed.studentId },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { loginName: parsed.studentId },
        select: { id: true },
      }),
    ]);

    if (studentIdOwner && studentIdOwner.id !== profile.id) {
      throw new Error("เลขประจำตัวนักเรียนนี้มีอยู่แล้ว");
    }

    if (loginOwner && loginOwner.id !== profile.userId) {
      throw new Error("เลขประจำตัวนักเรียนนี้ถูกใช้เป็นชื่อบัญชีแล้ว");
    }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: profile.userId },
      data: {
        loginName: parsed.studentId,
        displayName: parsed.fullName,
        isActive: parsed.isActive,
      },
    }),
    prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        studentId: parsed.studentId,
        fullName: parsed.fullName,
        gradeLevel: parsed.gradeLevel,
        classroom: parsed.classroom,
      },
    }),
  ]);

  return {
    previousStudentId: profile.studentId,
    studentId: parsed.studentId,
    fullName: parsed.fullName,
  };
}

export async function resetTeacherStudentPassword(
  currentUser: CurrentUser | null,
  studentProfileId: string,
) {
  requireRole(currentUser, [UserRole.TEACHER]);

  const profile = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    select: { userId: true, studentId: true, fullName: true },
  });

  if (!profile) {
    throw new Error("ไม่พบนักเรียนที่ต้องการรีเซ็ตรหัสผ่าน");
  }

  const initialPassword = defaultStudentInitialPassword;

  await prisma.user.update({
    where: { id: profile.userId },
    data: {
      passwordHash: await hashPassword(initialPassword),
      mustChangePassword: true,
    },
  });

  return {
    studentId: profile.studentId,
    fullName: profile.fullName,
    initialPassword,
  };
}

export async function findExistingStudentIds(studentIds: string[]) {
  if (studentIds.length === 0) {
    return new Set<string>();
  }

  const existing = await prisma.studentProfile.findMany({
    where: { studentId: { in: studentIds } },
    select: { studentId: true },
  });

  return new Set(existing.map((student) => student.studentId));
}

export async function importStudents(
  currentUser: CurrentUser | null,
  rows: ImportedStudentRow[],
) {
  requireRole(currentUser, [UserRole.TEACHER]);

  const existing = await prisma.studentProfile.findMany({
    where: { studentId: { in: rows.map((row) => row.studentId) } },
    select: { studentId: true },
  });

  if (existing.length > 0) {
    throw new Error(
      `พบเลขประจำตัวนักเรียนที่มีอยู่แล้ว: ${existing
        .map((row) => row.studentId)
        .join(", ")}`,
    );
  }

  const created: Array<{
    studentId: string;
    fullName: string;
    initialPassword: string;
  }> = [];

  for (const row of rows) {
    const initialPassword = defaultStudentInitialPassword;
    const user = await prisma.user.create({
      data: {
        role: UserRole.STUDENT,
        loginName: row.studentId,
        displayName: row.fullName,
        passwordHash: await hashPassword(initialPassword),
        mustChangePassword: true,
      },
    });

    await prisma.studentProfile.create({
      data: {
        userId: user.id,
        studentId: row.studentId,
        fullName: row.fullName,
        gradeLevel: row.gradeLevel,
        classroom: row.classroom,
      },
    });

    created.push({
      studentId: row.studentId,
      fullName: row.fullName,
      initialPassword,
    });
  }

  return created;
}
