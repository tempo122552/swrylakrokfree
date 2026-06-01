import { describe, expect, it } from "vitest";
import {
  buildTeacherExchangeHistoryExportWorkbookData,
  buildTeacherExchangeHistoryRows,
  normalizeTeacherExchangeHistoryFilters,
} from "./exchange-history";

describe("normalizeTeacherExchangeHistoryFilters", () => {
  it("trims text filters and converts date inputs into Bangkok day ranges", () => {
    const filters = normalizeTeacherExchangeHistoryFilters({
      q: "  10001  ",
      classroom: "  ม.1/1  ",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-02",
    });

    expect(filters).toMatchObject({
      q: "10001",
      classroom: "ม.1/1",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-02",
    });
    expect(filters.createdAt?.gte?.toISOString()).toBe("2026-05-31T17:00:00.000Z");
    expect(filters.createdAt?.lte?.toISOString()).toBe("2026-06-02T16:59:59.999Z");
  });

  it("ignores invalid dates instead of sending broken filters to the database", () => {
    const filters = normalizeTeacherExchangeHistoryFilters({
      q: "",
      classroom: "",
      dateFrom: "not-a-date",
      dateTo: "2026-13-01",
    });

    expect(filters).toEqual({});
  });
});

describe("buildTeacherExchangeHistoryRows", () => {
  it("summarizes exchange items for the teacher history table", () => {
    const rows = buildTeacherExchangeHistoryRows([
      {
        id: "exchange_1",
        createdAt: new Date("2026-06-01T03:00:00.000Z"),
        totalPointsEarned: 6,
        studentProfile: {
          studentId: "10001",
          fullName: "นักเรียน ตัวอย่าง",
          classroom: "ม.1/1",
        },
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
    ]);

    expect(rows).toEqual([
      {
        id: "exchange_1",
        createdAt: "2026-06-01T03:00:00.000Z",
        studentId: "10001",
        studentName: "นักเรียน ตัวอย่าง",
        classroom: "ม.1/1",
        staffName: "เจ้าหน้าที่ ตัวอย่าง",
        totalItemCount: 8,
        totalPointsEarned: 6,
        itemSummary: "ขวดพลาสติก 5 ชิ้น (5 แต้ม), ฉลากพลาสติก 3 ชิ้น (1 แต้ม)",
      },
    ]);
  });
});

describe("buildTeacherExchangeHistoryExportWorkbookData", () => {
  it("adds filter summary and Thai column headers for the filtered export", () => {
    const workbookData = buildTeacherExchangeHistoryExportWorkbookData({
      filters: {
        q: "10001",
        classroom: "ม.1/1",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-02",
      },
      rows: [
        {
          id: "exchange_1",
          createdAt: "2026-06-01T03:00:00.000Z",
          studentId: "10001",
          studentName: "นักเรียน ตัวอย่าง",
          classroom: "ม.1/1",
          staffName: "เจ้าหน้าที่ ตัวอย่าง",
          totalItemCount: 8,
          totalPointsEarned: 6,
          itemSummary: "ขวดพลาสติก 5 ชิ้น (5 แต้ม), ฉลากพลาสติก 3 ชิ้น (1 แต้ม)",
        },
      ],
    });

    expect(workbookData.summary).toContainEqual({
      ตัวกรอง: "คำค้นหา",
      ค่า: "10001",
    });
    expect(workbookData.summary).toContainEqual({
      ตัวกรอง: "ห้องเรียน",
      ค่า: "ม.1/1",
    });
    expect(workbookData.exchanges[0]).toMatchObject({
      "เลขประจำตัวนักเรียน": "10001",
      "ชื่อ-นามสกุล": "นักเรียน ตัวอย่าง",
      "ห้องเรียน": "ม.1/1",
      "รายการขยะ": "ขวดพลาสติก 5 ชิ้น (5 แต้ม), ฉลากพลาสติก 3 ชิ้น (1 แต้ม)",
      "จำนวนชิ้น": 8,
      "แต้ม": 6,
      "เจ้าหน้าที่": "เจ้าหน้าที่ ตัวอย่าง",
    });
  });
});
