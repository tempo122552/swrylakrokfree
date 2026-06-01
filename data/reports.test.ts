import { describe, expect, it } from "vitest";
import {
  buildTeacherDashboardView,
  buildTeacherExportWorkbookData,
} from "./reports";

describe("buildTeacherExportWorkbookData", () => {
  it("formats student totals and exchange rows for Excel", () => {
    const workbookData = buildTeacherExportWorkbookData({
      students: [
        {
          studentId: "10001",
          fullName: "นักเรียน ตัวอย่างหนึ่ง",
          gradeLevel: "ม.1",
          classroom: "ม.1/1",
          user: { isActive: true, mustChangePassword: true },
          exchanges: [{ totalPointsEarned: 5 }],
          pointAdjustments: [{ pointDelta: 2 }],
        },
      ],
      exchanges: [
        {
          createdAt: new Date("2026-06-01T03:00:00.000Z"),
          totalPointsEarned: 6,
          studentProfile: {
            studentId: "10001",
            fullName: "นักเรียน ตัวอย่างหนึ่ง",
            classroom: "ม.1/1",
          },
          items: [
            {
              wasteType: { name: "ขวดพลาสติก" },
              itemCount: 5,
              pointsEarned: 5,
            },
            {
              wasteType: { name: "ฉลากพลาสติก" },
              itemCount: 3,
              pointsEarned: 1,
            },
          ],
        },
      ],
      wasteTypeSummary: [{ wasteTypeName: "ขวดพลาสติก", itemCount: 5 }],
      classroomRankings: [
        {
          studentId: "10001",
          fullName: "นักเรียน ตัวอย่างหนึ่ง",
          classroom: "ม.1/1",
          totalPoints: 7,
        },
      ],
    });

    expect(workbookData.students[0]).toMatchObject({
      "เลขประจำตัวนักเรียน": "10001",
      "ชื่อ-นามสกุล": "นักเรียน ตัวอย่างหนึ่ง",
      "ห้องเรียน": "ม.1/1",
      "แต้มสะสม": 7,
      "ต้องเปลี่ยนรหัสผ่าน": "ใช่",
      "สถานะ": "ใช้งาน",
    });
    expect(workbookData.exchanges[0]).toMatchObject({
      "เลขประจำตัวนักเรียน": "10001",
      "นักเรียน": "นักเรียน ตัวอย่างหนึ่ง",
      "แต้ม": 6,
      "รายการขยะ": "ขวดพลาสติก 5 ชิ้น (5 แต้ม), ฉลากพลาสติก 3 ชิ้น (1 แต้ม)",
    });
    expect(workbookData.classroomRankings[0]).toMatchObject({
      "อันดับในห้อง": 1,
      "ห้องเรียน": "ม.1/1",
      "แต้มสะสม": 7,
    });
  });
});

describe("buildTeacherDashboardView", () => {
  it("summarizes teacher dashboard highlights and totals", () => {
    const today = new Date("2026-06-01T09:00:00.000Z");
    const yesterday = new Date("2026-05-31T09:00:00.000Z");
    const dashboard = buildTeacherDashboardView({
      now: today,
      students: [
        {
          classroom: "ม.1/1",
          exchanges: [{ totalPointsEarned: 10 }],
          pointAdjustments: [{ pointDelta: 2 }],
        },
        {
          classroom: "ม.2/1",
          exchanges: [{ totalPointsEarned: 6 }],
          pointAdjustments: [{ pointDelta: -1 }],
        },
      ],
      exchanges: [
        { createdAt: today, totalPointsEarned: 10 },
        { createdAt: yesterday, totalPointsEarned: 6 },
      ],
      recentExchanges: [
        {
          id: "exchange_1",
          createdAt: today,
          totalPointsEarned: 10,
          studentProfile: {
            fullName: "นักเรียน ตัวอย่าง",
            classroom: "ม.1/1",
          },
        },
      ],
      exchangeItems: [
        {
          itemCount: 12,
          wasteType: { name: "ขวดพลาสติก" },
          exchange: {
            createdAt: today,
            studentProfile: { classroom: "ม.1/1" },
          },
        },
        {
          itemCount: 4,
          wasteType: { name: "ฝาขวด" },
          exchange: {
            createdAt: yesterday,
            studentProfile: { classroom: "ม.2/1" },
          },
        },
      ],
    });

    expect(dashboard.totals).toEqual({
      students: 2,
      exchanges: 2,
      points: 17,
      itemCount: 16,
    });
    expect(dashboard.highlights.today).toEqual({
      exchangeCount: 1,
      points: 10,
      itemCount: 12,
    });
    expect(dashboard.highlights.topClassroom).toMatchObject({
      classroom: "ม.1/1",
      items: 12,
      points: 12,
    });
    expect(dashboard.highlights.topWasteType).toEqual({
      wasteTypeName: "ขวดพลาสติก",
      itemCount: 12,
    });
    expect(dashboard.recentExchanges[0]).toMatchObject({
      id: "exchange_1",
      studentName: "นักเรียน ตัวอย่าง",
      classroom: "ม.1/1",
      totalPointsEarned: 10,
    });
  });
});
