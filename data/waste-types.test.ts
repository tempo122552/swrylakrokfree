import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireSystemTeacher: vi.fn(),
  wasteType: {
    create: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/data/db", () => ({
  prisma: {
    wasteType: mocks.wasteType,
  },
}));

vi.mock("@/data/permissions", () => ({
  requireSystemTeacher: mocks.requireSystemTeacher,
}));

import {
  canHardDeleteWasteType,
  createWasteType,
  deleteWasteType,
} from "./waste-types";

const teacher = { id: "teacher_1" } as never;

describe("createWasteType", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.wasteType.create.mockReset();
    mocks.wasteType.findUnique.mockReset();
    mocks.wasteType.update.mockReset();
  });

  it("reactivates an existing waste type instead of creating a duplicate", async () => {
    mocks.wasteType.findUnique.mockResolvedValue({
      id: "waste_type_1",
      name: "plastic bottle",
      isActive: false,
    });
    mocks.wasteType.update.mockResolvedValue({
      id: "waste_type_1",
      name: "plastic bottle",
      itemsPerPoint: 2,
      pointsPerUnit: 300,
      isActive: true,
    });

    await createWasteType(teacher, {
      name: " plastic bottle ",
      itemsPerPoint: 2,
      pointsPerUnit: 300,
    });

    expect(mocks.wasteType.findUnique).toHaveBeenCalledWith({
      where: { name: "plastic bottle" },
    });
    expect(mocks.wasteType.update).toHaveBeenCalledWith({
      where: { id: "waste_type_1" },
      data: { itemsPerPoint: 2, pointsPerUnit: 300, isActive: true },
    });
    expect(mocks.wasteType.create).not.toHaveBeenCalled();
  });

  it("rejects non-positive points per unit", async () => {
    await expect(
      createWasteType(teacher, {
        name: "old phone",
        itemsPerPoint: 1,
        pointsPerUnit: 0,
      }),
    ).rejects.toThrow("pointsPerUnit must be a positive integer");
  });
});

describe("canHardDeleteWasteType", () => {
  it("allows deleting unused waste types", () => {
    expect(
      canHardDeleteWasteType({
        exchangeItems: 0,
        remainders: 0,
        remainderAdjustments: 0,
      }),
    ).toBe(true);
  });

  it("blocks deleting waste types with usage history", () => {
    expect(
      canHardDeleteWasteType({
        exchangeItems: 1,
        remainders: 0,
        remainderAdjustments: 0,
      }),
    ).toBe(false);
  });
});

describe("deleteWasteType", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes an unused waste type", async () => {
    mocks.wasteType.findUnique.mockResolvedValue({
      id: "waste_type_1",
      name: "wrong waste",
      _count: {
        exchangeItems: 0,
        remainders: 0,
        remainderAdjustments: 0,
      },
    });
    mocks.wasteType.delete.mockResolvedValue({
      id: "waste_type_1",
      name: "wrong waste",
    });

    await deleteWasteType(teacher, "waste_type_1");

    expect(mocks.wasteType.delete).toHaveBeenCalledWith({
      where: { id: "waste_type_1" },
    });
  });
});
