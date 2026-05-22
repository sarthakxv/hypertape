import { describe, expect, test } from "vitest";
import { normalizeOutcomeMeta } from "@/lib/hyperliquid/normalize-outcome-meta";
import type { RawOutcomeMetaEntry } from "@/lib/hyperliquid/hyperliquid-client";

const NOW = Date.parse("2026-05-23T00:00:00.000Z");

describe("outcome meta normalization", () => {
  test("normalizes the real outcomeMeta shape: id, encodings, primary/dual, parsed fields, future expiry active", () => {
    const raw: RawOutcomeMetaEntry = {
      outcome: 7,
      name: "BTC above 105k by 06:00 UTC",
      description: "class:priceBinary|underlying:BTC|expiry:20260523-0600|targetPrice:105000|period:1d",
      sideSpecs: [{ name: "Yes" }, { name: "No" }]
    };

    const market = normalizeOutcomeMeta(raw, NOW);

    expect(market.id).toBe("7");
    expect(market.outcomeId).toBe(7);
    expect(market.name).toBe("BTC above 105k by 06:00 UTC");
    expect(market.description).toBe(raw.description);

    expect(market.sides[0].encoding).toBe(70);
    expect(market.sides[1].encoding).toBe(71);
    expect(market.sides[0].label).toBe("Yes");
    expect(market.sides[1].label).toBe("No");
    expect(market.primarySide).toBe(0);
    expect(market.dualSide).toBe(1);

    expect(market.underlying).toBe("BTC");
    expect(market.targetPrice).toBe(105000);
    expect(market.period).toBe("1d");
    expect(market.expiryTime).toBe("2026-05-23T06:00:00.000Z");

    // expiry 06:00 is in the future relative to NOW (00:00)
    expect(market.status).toBe("active");
    expect(market.statusSource).toBe("expiry");

    expect(market.raw).toBe(raw);
  });

  test("derives Yes primary even when Yes is listed second", () => {
    const raw: RawOutcomeMetaEntry = {
      outcome: 12,
      name: "ETH flips",
      description: "class:priceBinary|underlying:ETH|expiry:20260601-0600|targetPrice:4000|period:1d",
      sideSpecs: [{ name: "No" }, { name: "Yes" }]
    };

    const market = normalizeOutcomeMeta(raw, NOW);

    expect(market.sides[0].encoding).toBe(120);
    expect(market.sides[1].encoding).toBe(121);
    expect(market.primarySide).toBe(1);
    expect(market.dualSide).toBe(0);
  });

  test("falls back to side zero primary for non-Yes/No (Up/Down) labels", () => {
    const raw: RawOutcomeMetaEntry = {
      outcome: 9,
      name: "SOL above 180 by Friday close",
      description: "class:priceBinary|underlying:SOL|expiry:20260524-0000|targetPrice:180|period:1w",
      sideSpecs: [{ name: "Up" }, { name: "Down" }]
    };

    const market = normalizeOutcomeMeta(raw, NOW);

    expect(market.primarySide).toBe(0);
    expect(market.dualSide).toBe(1);
    expect(market.sides.map((side) => side.label)).toEqual(["Up", "Down"]);
    expect(market.underlying).toBe("SOL");
  });

  test("derives settled status from a past expiry", () => {
    const raw: RawOutcomeMetaEntry = {
      outcome: 8,
      name: "HYPE closed green",
      description: "class:priceBinary|underlying:HYPE|expiry:20260522-0000|targetPrice:30|period:1d",
      sideSpecs: [{ name: "Yes" }, { name: "No" }]
    };

    const market = normalizeOutcomeMeta(raw, NOW);

    expect(market.expiryTime).toBe("2026-05-22T00:00:00.000Z");
    expect(market.status).toBe("settled");
    expect(market.statusSource).toBe("expiry");
  });

  test("treats an outcome with no parseable expiry as active with expiry status source", () => {
    const raw: RawOutcomeMetaEntry = {
      outcome: 81,
      name: "Recurring Fallback",
      description: "other",
      sideSpecs: [{ name: "Yes" }, { name: "No" }]
    };

    const market = normalizeOutcomeMeta(raw, NOW);

    expect(market.expiryTime).toBeUndefined();
    expect(market.status).toBe("active");
    expect(market.statusSource).toBe("expiry");
  });
});
