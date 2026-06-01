import { describe, expect, it } from "vitest";
import { calculatePointEffect } from "./rewards";

describe("calculatePointEffect", () => {
  it("awards one point per item when the rate is one", () => {
    expect(
      calculatePointEffect({
        previousRemainder: 0,
        itemCount: 5,
        itemsPerPoint: 1,
      }),
    ).toEqual({
      totalCountedItems: 5,
      pointsEarned: 5,
      newRemainder: 0,
    });
  });

  it("keeps a remainder when the item count does not complete a point", () => {
    expect(
      calculatePointEffect({
        previousRemainder: 0,
        itemCount: 2,
        itemsPerPoint: 3,
      }),
    ).toEqual({
      totalCountedItems: 2,
      pointsEarned: 0,
      newRemainder: 2,
    });
  });

  it("combines an existing remainder with new items", () => {
    expect(
      calculatePointEffect({
        previousRemainder: 2,
        itemCount: 4,
        itemsPerPoint: 3,
      }),
    ).toEqual({
      totalCountedItems: 6,
      pointsEarned: 2,
      newRemainder: 0,
    });
  });

  it("rejects invalid counts", () => {
    expect(() =>
      calculatePointEffect({
        previousRemainder: -1,
        itemCount: 1,
        itemsPerPoint: 3,
      }),
    ).toThrow("previousRemainder must be a non-negative integer");

    expect(() =>
      calculatePointEffect({
        previousRemainder: 0,
        itemCount: 0,
        itemsPerPoint: 3,
      }),
    ).toThrow("itemCount must be a positive integer");

    expect(() =>
      calculatePointEffect({
        previousRemainder: 0,
        itemCount: 1,
        itemsPerPoint: 0,
      }),
    ).toThrow("itemsPerPoint must be a positive integer");
  });
});
