import { describe, expect, test } from "vitest";
import { deriveTargetDelta, formatSignedDelta } from "@/lib/markets/target-delta";

describe("deriveTargetDelta", () => {
  test("returns null when there is no target", () => {
    expect(deriveTargetDelta(undefined, 77114.5)).toBeNull();
  });

  test("computes a positive delta when spot is above target", () => {
    expect(deriveTargetDelta(76772, 77114.5)).toEqual({
      target: 76772,
      current: 77114.5,
      delta: 342.5,
      deltaPct: 342.5 / 76772
    });
  });

  test("computes a negative delta when spot is below target", () => {
    const result = deriveTargetDelta(77451, 77114.5);
    expect(result?.delta).toBeCloseTo(-336.5, 5);
    expect(result?.deltaPct).toBeCloseTo(-336.5 / 77451, 9);
  });

  test("returns null current/delta when spot is missing", () => {
    expect(deriveTargetDelta(76772, null)).toEqual({
      target: 76772,
      current: null,
      delta: null,
      deltaPct: null
    });
  });

  test("returns null deltaPct when target is zero", () => {
    expect(deriveTargetDelta(0, 5)).toEqual({
      target: 0,
      current: 5,
      delta: 5,
      deltaPct: null
    });
  });
});

describe("formatSignedDelta", () => {
  test("renders an em-dash when delta is null", () => {
    expect(formatSignedDelta(null, null)).toBe("—");
  });

  test("renders an up arrow and plus sign for a positive delta", () => {
    expect(formatSignedDelta(342.5, 0.00446)).toBe("↑ +$343 (+0.45%)");
  });

  test("renders a down arrow and minus sign for a negative delta", () => {
    expect(formatSignedDelta(-336.5, -0.004344)).toBe("↓ -$337 (-0.43%)");
  });

  test("omits the percent when deltaPct is null", () => {
    expect(formatSignedDelta(5, null)).toBe("↑ +$5");
  });
});
