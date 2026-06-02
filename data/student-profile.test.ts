import { describe, expect, it } from "vitest";
import {
  buildTeacherStudentProfileView,
  canHardDeleteStudent,
  parseTeacherStudentListFilters,
  parseTeacherStudentUpdateInput,
} from "./students";

describe("buildTeacherStudentProfileView", () => {
  it("summarizes a student profile for teacher review", () => {
    const profile = buildTeacherStudentProfileView({
      id: "student_profile_1",
      studentId: "10001",
      fullName: "นักเรียน ตัวอย่าง",
      gradeLevel: "ม.1",
      classroom: "ม.1/1",
      user: {
        loginName: "10001",
        isActive: true,
        mustChangePassword: false,
      },
      remainders: [
        {
          itemCount: 2,
          wasteType: { name: "ฉลากพลาสติก", itemsPerPoint: 3, pointsPerUnit: 1 },
        },
      ],
      exchanges: [
        {
          id: "exchange_1",
          createdAt: new Date("2026-06-01T03:00:00.000Z"),
          totalPointsEarned: 6,
          staffUser: { displayName: "เจ้าหน้าที่ ตัวอย่าง" },
          items: [
            {
              itemCount: 5,
              pointsEarned: 5,
              wasteType: { name: "ขวดพลาสติก" },
            },
            {
              itemCount: 3,
              pointsEarned: 1,
              wasteType: { name: "ฉลากพลาสติก" },
            },
          ],
        },
      ],
      pointAdjustments: [
        {
          id: "adjustment_1",
          createdAt: new Date("2026-06-01T04:00:00.000Z"),
          pointDelta: -1,
          reason: "แก้รายการซ้ำ",
          relatedExchangeId: "exchange_1",
          createdByUser: { displayName: "เจ้าหน้าที่ ตัวอย่าง" },
        },
      ],
    });

    expect(profile.student).toMatchObject({
      studentId: "10001",
      fullName: "นักเรียน ตัวอย่าง",
      gradeLevel: "ม.1",
      classroom: "ม.1/1",
      loginName: "10001",
      isActive: true,
      mustChangePassword: false,
    });
    expect(profile.totals).toEqual({
      points: 5,
      exchangeCount: 1,
      adjustmentCount: 1,
      remainderItemCount: 2,
    });
    expect(profile.remainders).toEqual([
      {
        wasteTypeName: "ฉลากพลาสติก",
        itemCount: 2,
        itemsPerPoint: 3,
        pointsPerUnit: 1,
        itemsUntilNextPoint: 1,
      },
    ]);
    expect(profile.recentExchanges[0]).toMatchObject({
      id: "exchange_1",
      totalItemCount: 8,
      totalPointsEarned: 6,
      staffName: "เจ้าหน้าที่ ตัวอย่าง",
      itemSummary: "ขวดพลาสติก 5 ชิ้น (5 แต้ม), ฉลากพลาสติก 3 ชิ้น (1 แต้ม)",
    });
    expect(profile.recentAdjustments[0]).toMatchObject({
      id: "adjustment_1",
      pointDelta: -1,
      reason: "แก้รายการซ้ำ",
      createdByName: "เจ้าหน้าที่ ตัวอย่าง",
      relatedExchangeId: "exchange_1",
    });
  });
});

describe("parseTeacherStudentUpdateInput", () => {
  it("trims and accepts editable student account fields", () => {
    expect(
      parseTeacherStudentUpdateInput({
        studentId: " 10001 ",
        fullName: " นักเรียน ตัวอย่าง ",
        gradeLevel: " ม.1 ",
        classroom: " ม.1/1 ",
        isActive: true,
      }),
    ).toEqual({
      studentId: "10001",
      fullName: "นักเรียน ตัวอย่าง",
      gradeLevel: "ม.1",
      classroom: "ม.1/1",
      isActive: true,
    });
  });

  it("rejects student IDs with spaces", () => {
    expect(() =>
      parseTeacherStudentUpdateInput({
        studentId: "10 001",
        fullName: "นักเรียน ตัวอย่าง",
        gradeLevel: "ม.1",
        classroom: "ม.1/1",
        isActive: true,
      }),
    ).toThrow("เลขประจำตัวนักเรียนต้องไม่มีช่องว่าง");
  });

  it("requires core student profile fields", () => {
    expect(() =>
      parseTeacherStudentUpdateInput({
        studentId: "10001",
        fullName: "",
        gradeLevel: "ม.1",
        classroom: "ม.1/1",
        isActive: true,
      }),
    ).toThrow("กรอกชื่อ-นามสกุล");
  });
});

describe("parseTeacherStudentListFilters", () => {
  it("trims search filters and accepts known account statuses", () => {
    expect(
      parseTeacherStudentListFilters({
        q: " 10001 ",
        classroom: " ม.1/1 ",
        status: "must_change_password",
      }),
    ).toEqual({
      q: "10001",
      classroom: "ม.1/1",
      status: "must_change_password",
      page: 1,
      pageSize: 25,
    });
  });

  it("uses the first value from repeated query params", () => {
    expect(
      parseTeacherStudentListFilters({
        q: ["นักเรียน", "10001"],
        classroom: ["ม.2/1"],
        status: ["inactive", "active"],
        page: ["3", "4"],
        pageSize: ["50", "100"],
      }),
    ).toEqual({
      q: "นักเรียน",
      classroom: "ม.2/1",
      status: "inactive",
      page: 3,
      pageSize: 50,
    });
  });

  it("falls back to safe pagination defaults for unknown values", () => {
    expect(
      parseTeacherStudentListFilters({
        q: "",
        classroom: "",
        status: "archived",
        page: "-2",
        pageSize: "999",
      }),
    ).toEqual({
      q: "",
      classroom: "",
      status: "all",
      page: 1,
      pageSize: 25,
    });
  });
});

describe("canHardDeleteStudent", () => {
  it("allows deleting a student with no activity records", () => {
    expect(
      canHardDeleteStudent({
        exchanges: 0,
        remainders: 0,
        pointAdjustments: 0,
        remainderAdjustments: 0,
      }),
    ).toBe(true);
  });

  it("blocks deleting a student with exchange history", () => {
    expect(
      canHardDeleteStudent({
        exchanges: 1,
        remainders: 0,
        pointAdjustments: 0,
        remainderAdjustments: 0,
      }),
    ).toBe(false);
  });

  it("blocks deleting a student with remainder or adjustment history", () => {
    expect(
      canHardDeleteStudent({
        exchanges: 0,
        remainders: 1,
        pointAdjustments: 0,
        remainderAdjustments: 0,
      }),
    ).toBe(false);
    expect(
      canHardDeleteStudent({
        exchanges: 0,
        remainders: 0,
        pointAdjustments: 1,
        remainderAdjustments: 0,
      }),
    ).toBe(false);
  });
});
