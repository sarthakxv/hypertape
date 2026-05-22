import { describe, expect, test } from "vitest";
import { normalizeOutcomeMeta } from "@/lib/hyperliquid/normalize-outcome-meta";

describe("outcome meta normalization", () => {
  test("normalizes side labels, encodings, primary side, quote token, and raw metadata", () => {
    const market = normalizeOutcomeMeta({
      outcomeId: 7,
      questionId: 3,
      name: "BTC above 105k by 06:00 UTC",
      description: "Resolves Yes if BTC trades above 105k before expiry.",
      sideSpecs: [{ name: "No" }, { name: "Yes" }],
      quoteToken: "USDH",
      expiryTime: "2026-05-23T06:00:00.000Z",
      status: "active"
    }, 1700000000000);

    expect(market.id).toBe("7");
    expect(market.primarySide).toBe(1);
    expect(market.dualSide).toBe(0);
    expect(market.quoteToken).toBe("USDH");
    expect(market.sides[0].encoding).toBe(70);
    expect(market.sides[1].encoding).toBe(71);
    expect(market.status).toBe("active");
    expect(market.statusSource).toBe("metadata");
    expect(market.raw).toMatchObject({ outcomeId: 7 });
  });

  test("uses side zero as primary for nonstandard HYPE-style metadata", () => {
    const market = normalizeOutcomeMeta({
      outcomeId: 8,
      questionId: 4,
      name: "HYPE closes green today",
      description: "Resolves Yes if HYPE closes above the daily open.",
      sideSpecs: [{ name: "Yes" }, { name: "No" }],
      quoteToken: "USDH",
      expiryTime: "2026-05-23T00:00:00.000Z",
      status: "active"
    }, 1700000000000);

    expect(market.id).toBe("8");
    expect(market.name).toBe("HYPE closes green today");
    expect(market.primarySide).toBe(0);
    expect(market.dualSide).toBe(1);
    expect(market.sides[0].coin).toBe("#80");
    expect(market.sides[1].tokenName).toBe("+81");
  });

  test("falls back to side zero primary for non-Yes-No SOL metadata", () => {
    const market = normalizeOutcomeMeta({
      outcomeId: 9,
      questionId: 5,
      name: "SOL above 180 by Friday close",
      description: "Resolves Up if SOL is above 180 by Friday close.",
      sideSpecs: [{ name: "Up" }, { name: "Down" }],
      quoteToken: "USDC",
      expiryTime: "2026-05-24T00:00:00.000Z",
      status: "active"
    }, 1700000000000);

    expect(market.id).toBe("9");
    expect(market.primarySide).toBe(0);
    expect(market.dualSide).toBe(1);
    expect(market.sides.map((side) => side.label)).toEqual(["Up", "Down"]);
    expect(market.quoteToken).toBe("USDC");
  });

  test("marks status source unknown when metadata status is absent or unrecognized", () => {
    const market = normalizeOutcomeMeta({
      outcomeId: 10,
      name: "Unknown status market",
      status: "paused"
    }, 1700000000000);

    expect(market.status).toBe("unknown");
    expect(market.statusSource).toBe("unknown");
  });
});
