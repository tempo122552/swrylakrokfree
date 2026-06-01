export type PointCalculationInput = {
  previousRemainder: number;
  itemCount: number;
  itemsPerPoint: number;
};

export type PointCalculationResult = {
  totalCountedItems: number;
  pointsEarned: number;
  newRemainder: number;
};

function assertInteger(name: string, value: number, minimum: number) {
  if (!Number.isInteger(value) || value < minimum) {
    const qualifier = minimum === 0 ? "non-negative" : "positive";
    throw new Error(`${name} must be a ${qualifier} integer`);
  }
}

export function calculatePointEffect({
  previousRemainder,
  itemCount,
  itemsPerPoint,
}: PointCalculationInput): PointCalculationResult {
  assertInteger("previousRemainder", previousRemainder, 0);
  assertInteger("itemCount", itemCount, 1);
  assertInteger("itemsPerPoint", itemsPerPoint, 1);

  if (previousRemainder >= itemsPerPoint) {
    throw new Error("previousRemainder must be less than itemsPerPoint");
  }

  const totalCountedItems = previousRemainder + itemCount;

  return {
    totalCountedItems,
    pointsEarned: Math.floor(totalCountedItems / itemsPerPoint),
    newRemainder: totalCountedItems % itemsPerPoint,
  };
}
