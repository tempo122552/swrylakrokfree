import { describe, expect, it } from "vitest";
import {
  buildTeacherDashboardView,
  buildTeacherExportWorkbookData,
  resolveTeacherDashboardPeriod,
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
  it("resolves a selected month to Bangkok month boundaries", () => {
    const period = resolveTeacherDashboardPeriod({
      mode: "month",
      month: "2026-05",
      now: new Date("2026-06-02T05:00:00.000Z"),
      terms: [],
    });

    expect(period.mode).toBe("month");
    expect(period.startsAt.toISOString()).toBe("2026-04-30T17:00:00.000Z");
    expect(period.endsAt.toISOString()).toBe("2026-05-31T17:00:00.000Z");
  });

  it("filters dashboard totals to the selected reporting period", () => {
    const inPeriod = new Date("2026-05-10T05:00:00.000Z");
    const outsidePeriod = new Date("2026-06-10T05:00:00.000Z");
    const dashboard = buildTeacherDashboardView({
      now: inPeriod,
      period: {
        mode: "month",
        label: "พฤษภาคม 2569",
        startsAt: new Date("2026-04-30T17:00:00.000Z"),
        endsAt: new Date("2026-05-31T17:00:00.000Z"),
      },
      students: [
        {
          classroom: "ม.1/1",
          exchanges: [
            { createdAt: inPeriod, totalPointsEarned: 300 },
            { createdAt: outsidePeriod, totalPointsEarned: 50 },
          ],
          pointAdjustments: [
            { createdAt: inPeriod, pointDelta: 10 },
            { createdAt: outsidePeriod, pointDelta: 5 },
          ],
        },
      ],
      exchanges: [
        { createdAt: inPeriod, totalPointsEarned: 300 },
        { createdAt: outsidePeriod, totalPointsEarned: 50 },
      ],
      recentExchanges: [
        {
          id: "exchange_in_period",
          createdAt: inPeriod,
          totalPointsEarned: 300,
          studentProfile: {
            fullName: "นักเรียน ตัวอย่าง",
            classroom: "ม.1/1",
          },
        },
        {
          id: "exchange_outside_period",
          createdAt: outsidePeriod,
          totalPointsEarned: 50,
          studentProfile: {
            fullName: "นักเรียน นอกช่วง",
            classroom: "ม.1/1",
          },
        },
      ],
      exchangeItems: [
        {
          itemCount: 1,
          wasteType: { name: "มือถือเก่า" },
          exchange: {
            createdAt: inPeriod,
            studentProfile: { classroom: "ม.1/1" },
          },
        },
        {
          itemCount: 5,
          wasteType: { name: "ขวดพลาสติก" },
          exchange: {
            createdAt: outsidePeriod,
            studentProfile: { classroom: "ม.1/1" },
          },
        },
      ],
    } as Parameters<typeof buildTeacherDashboardView>[0] & {
      period: {
        mode: "month";
        label: string;
        startsAt: Date;
        endsAt: Date;
      };
    });

    expect(dashboard.period.label).toBe("พฤษภาคม 2569");
    expect(dashboard.totals).toEqual({
      students: 1,
      exchanges: 1,
      points: 310,
      itemCount: 1,
    });
    expect(dashboard.classroomBars).toEqual([
      { classroom: "ม.1/1", points: 310, items: 1 },
    ]);
    expect(dashboard.wasteTypePie).toEqual([
      { wasteTypeName: "มือถือเก่า", itemCount: 1 },
    ]);
    expect(dashboard.recentExchanges).toHaveLength(1);
  });

  it("summarizes teacher dashboard highlights and totals", () => {
    const today = new Date("2026-06-01T09:00:00.000Z");
    const yesterday = new Date("2026-05-31T09:00:00.000Z");
    const dashboard = buildTeacherDashboardView({
      now: today,
      students: [
        {
          classroom: "ม.1/1",
          exchanges: [{ createdAt: today, totalPointsEarned: 10 }],
          pointAdjustments: [{ createdAt: today, pointDelta: 2 }],
        },
        {
          classroom: "ม.2/1",
          exchanges: [{ createdAt: yesterday, totalPointsEarned: 6 }],
          pointAdjustments: [{ createdAt: yesterday, pointDelta: -1 }],
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
      exchanges: 1,
      points: 12,
      itemCount: 12,
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
