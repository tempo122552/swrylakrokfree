import { UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildTeacherBackupWorkbookData } from "./backups";

describe("buildTeacherBackupWorkbookData", () => {
  it("formats all core tables for backup without exposing password hashes", () => {
    const workbookData = buildTeacherBackupWorkbookData({
      generatedAt: new Date("2026-06-01T03:00:00.000Z"),
      users: [
        {
          id: "user_student_1",
          role: UserRole.STUDENT,
          loginName: "10001",
          displayName: "นักเรียน ตัวอย่าง",
          mustChangePassword: true,
          isSystemTeacher: false,
          isActive: true,
          createdAt: new Date("2026-05-31T03:00:00.000Z"),
          updatedAt: new Date("2026-05-31T03:30:00.000Z"),
        },
      ],
      students: [
        {
          id: "student_1",
          userId: "user_student_1",
          studentId: "10001",
          fullName: "นักเรียน ตัวอย่าง",
          gradeLevel: "ม.1",
          classroom: "ม.1/1",
          createdAt: new Date("2026-05-31T03:00:00.000Z"),
          updatedAt: new Date("2026-05-31T03:30:00.000Z"),
        },
      ],
      wasteTypes: [
        {
          id: "waste_plastic_bottle",
          name: "ขวดพลาสติก",
          itemsPerPoint: 1,
          isActive: true,
          createdAt: new Date("2026-05-31T03:00:00.000Z"),
          updatedAt: new Date("2026-05-31T03:30:00.000Z"),
        },
      ],
      exchanges: [
        {
          id: "exchange_1",
          studentProfileId: "student_1",
          staffUserId: "staff_1",
          totalPointsEarned: 5,
          createdAt: new Date("2026-06-01T02:00:00.000Z"),
          studentProfile: {
            studentId: "10001",
            fullName: "นักเรียน ตัวอย่าง",
            classroom: "ม.1/1",
          },
          staffUser: { displayName: "เจ้าหน้าที่ ตัวอย่าง" },
        },
      ],
      exchangeItems: [
        {
          id: "exchange_item_1",
          exchangeId: "exchange_1",
          wasteTypeId: "waste_plastic_bottle",
          itemCount: 5,
          previousRemainder: 0,
          pointsEarned: 5,
          newRemainder: 0,
          wasteType: { name: "ขวดพลาสติก" },
        },
      ],
      studentRemainders: [
        {
          id: "remainder_1",
          studentProfileId: "student_1",
          wasteTypeId: "waste_plastic_bottle",
          itemCount: 0,
          updatedAt: new Date("2026-06-01T02:00:00.000Z"),
          studentProfile: { studentId: "10001", fullName: "นักเรียน ตัวอย่าง" },
          wasteType: { name: "ขวดพลาสติก" },
        },
      ],
      pointAdjustments: [
        {
          id: "adjustment_1",
          studentProfileId: "student_1",
          createdByUserId: "staff_1",
          relatedExchangeId: "exchange_1",
          pointDelta: -1,
          reason: "แก้รายการซ้ำ",
          createdAt: new Date("2026-06-01T02:10:00.000Z"),
          studentProfile: { studentId: "10001", fullName: "นักเรียน ตัวอย่าง" },
          createdByUser: { displayName: "เจ้าหน้าที่ ตัวอย่าง" },
        },
      ],
      remainderAdjustments: [
        {
          id: "remainder_adjustment_1",
          pointAdjustmentId: "adjustment_1",
          studentProfileId: "student_1",
          wasteTypeId: "waste_plastic_bottle",
          previousRemainder: 1,
          newRemainder: 0,
          reason: "แก้เศษคงค้าง",
          createdAt: new Date("2026-06-01T02:10:00.000Z"),
          studentProfile: { studentId: "10001", fullName: "นักเรียน ตัวอย่าง" },
          wasteType: { name: "ขวดพลาสติก" },
        },
      ],
    });

    expect(workbookData.summary).toContainEqual({
      รายการ: "บัญชีผู้ใช้",
      จำนวน: 1,
    });
    expect(workbookData.users[0]).toMatchObject({
      id: "user_student_1",
      role: "STUDENT",
      loginName: "10001",
      displayName: "นักเรียน ตัวอย่าง",
      mustChangePassword: "ใช่",
      isActive: "ใช้งาน",
    });
    expect(workbookData.users[0]).not.toHaveProperty("passwordHash");
    expect(workbookData.students[0]).toMatchObject({
      studentId: "10001",
      classroom: "ม.1/1",
    });
    expect(workbookData.exchanges[0]).toMatchObject({
      id: "exchange_1",
      studentId: "10001",
      staffName: "เจ้าหน้าที่ ตัวอย่าง",
      totalPointsEarned: 5,
    });
    expect(workbookData.exchangeItems[0]).toMatchObject({
      exchangeId: "exchange_1",
      wasteTypeName: "ขวดพลาสติก",
      pointsEarned: 5,
    });
    expect(workbookData.pointAdjustments[0]).toMatchObject({
      relatedExchangeId: "exchange_1",
      pointDelta: -1,
      reason: "แก้รายการซ้ำ",
    });
  });
});
