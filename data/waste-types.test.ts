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
  });

  it("reactivates an existing waste type instead of creating a duplicate", async () => {
    mocks.wasteType.findUnique.mockResolvedValue({
      id: "waste_type_1",
      name: "ขวดพลาสติก",
      isActive: false,
    });
    mocks.wasteType.update.mockResolvedValue({
      id: "waste_type_1",
      name: "ขวดพลาสติก",
      itemsPerPoint: 2,
      isActive: true,
    });

    await createWasteType(teacher, {
      name: " ขวดพลาสติก ",
      itemsPerPoint: 2,
    });

    expect(mocks.wasteType.findUnique).toHaveBeenCalledWith({
      where: { name: "ขวดพลาสติก" },
    });
    expect(mocks.wasteType.update).toHaveBeenCalledWith({
      where: { id: "waste_type_1" },
      data: { itemsPerPoint: 2, isActive: true },
    });
    expect(mocks.wasteType.create).not.toHaveBeenCalled();
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
      name: "ขยะผิด",
      _count: {
        exchangeItems: 0,
        remainders: 0,
        remainderAdjustments: 0,
      },
    });
    mocks.wasteType.delete.mockResolvedValue({
      id: "waste_type_1",
      name: "ขยะผิด",
    });

    await deleteWasteType(teacher, "waste_type_1");

    expect(mocks.wasteType.delete).toHaveBeenCalledWith({
      where: { id: "waste_type_1" },
    });
  });
});
