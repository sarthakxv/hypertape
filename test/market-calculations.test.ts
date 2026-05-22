import { describe, expect, test } from "vitest";
import { calculateMid, calculateProbabilityDelta, calculateSpread } from "@/lib/markets/probability";
import { depthWithinPoints } from "@/lib/markets/depth";

describe("market calculations", () => {
  test("calculates mid only when bid and ask are both present", () => {
    expect(calculateMid(0.42, 0.44)).toBe(0.43);
    expect(calculateMid(0.42, null)).toBeNull();
    expect(calculateMid(null, 0.44)).toBeNull();
  });

  test("calculates spread only when bid and ask are both present", () => {
    expect(calculateSpread(0.42, 0.44)).toBeCloseTo(0.02);
    expect(calculateSpread(null, 0.44)).toBeNull();
  });

  test("calculates probability delta in probability units and points", () => {
    expect(calculateProbabilityDelta(0.421, 0.478)).toEqual({
      previous: 0.421,
      current: 0.478,
      delta: 0.056999999999999995,
      deltaPoints: 5.699999999999999
    });
  });

  test("calculates bid, ask, and total notional depth within point bands", () => {
    const result = depthWithinPoints(
      [
        { price: 0.43, size: 1000 },
        { price: 0.4, size: 1000 }
      ],
      [
        { price: 0.45, size: 2000 },
        { price: 0.5, size: 2000 }
      ],
      0.44,
      3
    );

    expect(result).toEqual({
      bidDepth: 430,
      askDepth: 900,
      totalDepth: 1330
    });
  });
});
