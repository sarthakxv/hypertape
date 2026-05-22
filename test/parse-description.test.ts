import { describe, expect, test } from "vitest";
import { parseOutcomeDescription } from "@/lib/hyperliquid/parse-description";

describe("parseOutcomeDescription", () => {
  test("parses a priceBinary description with expiry, targetPrice, and period", () => {
    const parsed = parseOutcomeDescription(
      "class:priceBinary|underlying:BTC|expiry:20260523-0600|targetPrice:77451|period:1d"
    );

    expect(parsed).toEqual({
      class: "priceBinary",
      underlying: "BTC",
      expiry: "2026-05-23T06:00:00.000Z",
      targetPrice: 77451,
      period: "1d"
    });
  });

  test("parses a priceBucket description with comma-separated priceThresholds", () => {
    const parsed = parseOutcomeDescription(
      "class:priceBucket|underlying:BTC|expiry:20260523-0600|priceThresholds:75902,79000|period:1d"
    );

    expect(parsed.class).toBe("priceBucket");
    expect(parsed.underlying).toBe("BTC");
    expect(parsed.expiry).toBe("2026-05-23T06:00:00.000Z");
    expect(parsed.priceThresholds).toEqual([75902, 79000]);
    expect(parsed.period).toBe("1d");
  });

  test("parses an index:N description", () => {
    expect(parseOutcomeDescription("index:0")).toEqual({ index: 0 });
    expect(parseOutcomeDescription("index:2")).toEqual({ index: 2 });
  });

  test("returns an empty object for literal 'other' input", () => {
    expect(parseOutcomeDescription("other")).toEqual({});
  });

  test("returns an empty object for empty or whitespace input", () => {
    expect(parseOutcomeDescription("")).toEqual({});
    expect(parseOutcomeDescription("   ")).toEqual({});
  });

  test("ignores empty segments and segments without a colon", () => {
    const parsed = parseOutcomeDescription("class:priceBinary||other|underlying:BTC");
    expect(parsed).toEqual({ class: "priceBinary", underlying: "BTC" });
  });

  test("drops numeric fields that are NaN", () => {
    const parsed = parseOutcomeDescription("class:priceBinary|targetPrice:abc");
    expect(parsed.class).toBe("priceBinary");
    expect(parsed.targetPrice).toBeUndefined();
    expect("targetPrice" in parsed).toBe(false);
  });

  test("splits each segment on the first colon only", () => {
    const parsed = parseOutcomeDescription("underlying:BTC:PERP");
    expect(parsed.underlying).toBe("BTC:PERP");
  });

  test("drops expiry when the format does not match YYYYMMDD-HHMM", () => {
    const parsed = parseOutcomeDescription("expiry:not-a-date");
    expect(parsed.expiry).toBeUndefined();
    expect("expiry" in parsed).toBe(false);
  });
});
