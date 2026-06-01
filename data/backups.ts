import "server-only";
import { UserRole } from "@prisma/client";
import { projectName } from "@/lib/brand";
import { prisma } from "@/data/db";
import { requireRole, type CurrentUser } from "@/data/permissions";

type BackupUser = {
  id: string;
  role: UserRole;
  loginName: string;
  displayName: string;
  mustChangePassword: boolean;
  isSystemTeacher: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type BackupStudent = {
  id: string;
  userId: string;
  studentId: string;
  fullName: string;
  gradeLevel: string;
  classroom: string;
  createdAt: Date;
  updatedAt: Date;
};

type BackupWasteType = {
  id: string;
  name: string;
  itemsPerPoint: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type BackupExchange = {
  id: string;
  studentProfileId: string;
  staffUserId: string;
  totalPointsEarned: number;
  createdAt: Date;
  studentProfile: {
    studentId: string;
    fullName: string;
    classroom: string;
  };
  staffUser: { displayName: string };
};

type BackupExchangeItem = {
  id: string;
  exchangeId: string;
  wasteTypeId: string;
  itemCount: number;
  previousRemainder: number;
  pointsEarned: number;
  newRemainder: number;
  wasteType: { name: string };
};

type BackupStudentRemainder = {
  id: string;
  studentProfileId: string;
  wasteTypeId: string;
  itemCount: number;
  updatedAt: Date;
  studentProfile: { studentId: string; fullName: string };
  wasteType: { name: string };
};

type BackupPointAdjustment = {
  id: string;
  studentProfileId: string;
  createdByUserId: string;
  relatedExchangeId: string | null;
  pointDelta: number;
  reason: string;
  createdAt: Date;
  studentProfile: { studentId: string; fullName: string };
  createdByUser: { displayName: string };
};

type BackupRemainderAdjustment = {
  id: string;
  pointAdjustmentId: string;
  studentProfileId: string;
  wasteTypeId: string;
  previousRemainder: number;
  newRemainder: number;
  reason: string;
  createdAt: Date;
  studentProfile: { studentId: string; fullName: string };
  wasteType: { name: string };
};

type TeacherBackupInput = {
  generatedAt: Date;
  users: BackupUser[];
  students: BackupStudent[];
  wasteTypes: BackupWasteType[];
  exchanges: BackupExchange[];
  exchangeItems: BackupExchangeItem[];
  studentRemainders: BackupStudentRemainder[];
  pointAdjustments: BackupPointAdjustment[];
  remainderAdjustments: BackupRemainderAdjustment[];
};

export function buildTeacherBackupWorkbookData({
  generatedAt,
  users,
  students,
  wasteTypes,
  exchanges,
  exchangeItems,
  studentRemainders,
  pointAdjustments,
  remainderAdjustments,
}: TeacherBackupInput) {
  return {
    summary: [
      { รายการ: "ชื่อโครงการ", จำนวน: projectName },
      { รายการ: "สร้างเมื่อ", จำนวน: formatDate(generatedAt) },
      { รายการ: "บัญชีผู้ใช้", จำนวน: users.length },
      { รายการ: "นักเรียน", จำนวน: students.length },
      { รายการ: "ชนิดขยะ", จำนวน: wasteTypes.length },
      { รายการ: "รายการแลกขยะ", จำนวน: exchanges.length },
      { รายการ: "รายการย่อยขยะ", จำนวน: exchangeItems.length },
      { รายการ: "เศษคงค้างนักเรียน", จำนวน: studentRemainders.length },
      { รายการ: "รายการปรับแต้ม", จำนวน: pointAdjustments.length },
      { รายการ: "รายการปรับเศษคงค้าง", จำนวน: remainderAdjustments.length },
    ],
    users: users.map((user) => ({
      id: user.id,
      role: user.role,
      loginName: user.loginName,
      displayName: user.displayName,
      mustChangePassword: formatBoolean(user.mustChangePassword),
      isSystemTeacher: formatBoolean(user.isSystemTeacher),
      isActive: formatStatus(user.isActive),
      createdAt: formatDate(user.createdAt),
      updatedAt: formatDate(user.updatedAt),
    })),
    students: students.map((student) => ({
      id: student.id,
      userId: student.userId,
      studentId: student.studentId,
      fullName: student.fullName,
      gradeLevel: student.gradeLevel,
      classroom: student.classroom,
      createdAt: formatDate(student.createdAt),
      updatedAt: formatDate(student.updatedAt),
    })),
    wasteTypes: wasteTypes.map((wasteType) => ({
      id: wasteType.id,
      name: wasteType.name,
      itemsPerPoint: wasteType.itemsPerPoint,
      isActive: formatStatus(wasteType.isActive),
      createdAt: formatDate(wasteType.createdAt),
      updatedAt: formatDate(wasteType.updatedAt),
    })),
    exchanges: exchanges.map((exchange) => ({
      id: exchange.id,
      studentProfileId: exchange.studentProfileId,
      studentId: exchange.studentProfile.studentId,
      studentName: exchange.studentProfile.fullName,
      classroom: exchange.studentProfile.classroom,
      staffUserId: exchange.staffUserId,
      staffName: exchange.staffUser.displayName,
      totalPointsEarned: exchange.totalPointsEarned,
      createdAt: formatDate(exchange.createdAt),
    })),
    exchangeItems: exchangeItems.map((item) => ({
      id: item.id,
      exchangeId: item.exchangeId,
      wasteTypeId: item.wasteTypeId,
      wasteTypeName: item.wasteType.name,
      itemCount: item.itemCount,
      previousRemainder: item.previousRemainder,
      pointsEarned: item.pointsEarned,
      newRemainder: item.newRemainder,
    })),
    studentRemainders: studentRemainders.map((remainder) => ({
      id: remainder.id,
      studentProfileId: remainder.studentProfileId,
      studentId: remainder.studentProfile.studentId,
      studentName: remainder.studentProfile.fullName,
      wasteTypeId: remainder.wasteTypeId,
      wasteTypeName: remainder.wasteType.name,
      itemCount: remainder.itemCount,
      updatedAt: formatDate(remainder.updatedAt),
    })),
    pointAdjustments: pointAdjustments.map((adjustment) => ({
      id: adjustment.id,
      studentProfileId: adjustment.studentProfileId,
      studentId: adjustment.studentProfile.studentId,
      studentName: adjustment.studentProfile.fullName,
      createdByUserId: adjustment.createdByUserId,
      createdByName: adjustment.createdByUser.displayName,
      relatedExchangeId: adjustment.relatedExchangeId ?? "",
      pointDelta: adjustment.pointDelta,
      reason: adjustment.reason,
      createdAt: formatDate(adjustment.createdAt),
    })),
    remainderAdjustments: remainderAdjustments.map((adjustment) => ({
      id: adjustment.id,
      pointAdjustmentId: adjustment.pointAdjustmentId,
      studentProfileId: adjustment.studentProfileId,
      studentId: adjustment.studentProfile.studentId,
      studentName: adjustment.studentProfile.fullName,
      wasteTypeId: adjustment.wasteTypeId,
      wasteTypeName: adjustment.wasteType.name,
      previousRemainder: adjustment.previousRemainder,
      newRemainder: adjustment.newRemainder,
      reason: adjustment.reason,
      createdAt: formatDate(adjustment.createdAt),
    })),
  };
}

export async function getTeacherBackupWorkbookData(currentUser: CurrentUser | null) {
  requireRole(currentUser, [UserRole.TEACHER]);

  const [
    users,
    students,
    wasteTypes,
    exchanges,
    exchangeItems,
    studentRemainders,
    pointAdjustments,
    remainderAdjustments,
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { loginName: "asc" }],
      select: {
        id: true,
        role: true,
        loginName: true,
        displayName: true,
        mustChangePassword: true,
        isSystemTeacher: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.studentProfile.findMany({
      orderBy: [{ gradeLevel: "asc" }, { classroom: "asc" }, { studentId: "asc" }],
    }),
    prisma.wasteType.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
    prisma.exchange.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        studentProfile: {
          select: { studentId: true, fullName: true, classroom: true },
        },
        staffUser: { select: { displayName: true } },
      },
    }),
    prisma.exchangeItem.findMany({
      include: { wasteType: { select: { name: true } } },
    }),
    prisma.studentRemainder.findMany({
      include: {
        studentProfile: { select: { studentId: true, fullName: true } },
        wasteType: { select: { name: true } },
      },
    }),
    prisma.pointAdjustment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        studentProfile: { select: { studentId: true, fullName: true } },
        createdByUser: { select: { displayName: true } },
      },
    }),
    prisma.remainderAdjustment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        studentProfile: { select: { studentId: true, fullName: true } },
        wasteType: { select: { name: true } },
      },
    }),
  ]);

  return buildTeacherBackupWorkbookData({
    generatedAt: new Date(),
    users,
    students,
    wasteTypes,
    exchanges,
    exchangeItems,
    studentRemainders,
    pointAdjustments,
    remainderAdjustments,
  });
}

function formatDate(date: Date) {
  return date.toISOString();
}

function formatBoolean(value: boolean) {
  return value ? "ใช่" : "ไม่ใช่";
}

function formatStatus(isActive: boolean) {
  return isActive ? "ใช้งาน" : "ปิดใช้งาน";
}
