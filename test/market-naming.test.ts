import { describe, expect, test } from "vitest";
import {
  bucketLegLabel,
  deriveMarketName,
  legLabel,
  periodLabel,
  underlyingLabel
} from "@/lib/hyperliquid/market-naming";

describe("underlyingLabel", () => {
  test("maps known symbols to readable names", () => {
    expect(underlyingLabel("BTC")).toBe("Bitcoin");
    expect(underlyingLabel("ETH")).toBe("Ethereum");
    expect(underlyingLabel("SOL")).toBe("Solana");
    expect(underlyingLabel("HYPE")).toBe("HYPE");
  });

  test("falls back to the raw symbol for unknown underlyings", () => {
    expect(underlyingLabel("DOGE")).toBe("DOGE");
  });

  test("falls back to Outcome when undefined", () => {
    expect(underlyingLabel(undefined)).toBe("Outcome");
  });
});

describe("periodLabel", () => {
  test("maps known periods to readable names", () => {
    expect(periodLabel("1d")).toBe("Daily");
    expect(periodLabel("1w")).toBe("Weekly");
    expect(periodLabel("1h")).toBe("Hourly");
    expect(periodLabel("4h")).toBe("4-Hour");
  });

  test("falls back to the raw period for unknown values", () => {
    expect(periodLabel("3d")).toBe("3d");
  });

  test("returns empty string when undefined", () => {
    expect(periodLabel(undefined)).toBe("");
  });
});

describe("deriveMarketName", () => {
  test("priceBinary -> Up or Down with underlying and period", () => {
    expect(
      deriveMarketName({ class: "priceBinary", underlying: "BTC", period: "1d" }, 80)
    ).toBe("Bitcoin Up or Down Daily");
  });

  test("priceBucket -> Multi Outcomes with underlying and period", () => {
    expect(
      deriveMarketName({ class: "priceBucket", underlying: "BTC", period: "1d" }, 15)
    ).toBe("Bitcoin Multi Outcomes Daily");
  });

  test("unknown/missing class -> Underlying + fallbackId, never 'Recurring'", () => {
    expect(deriveMarketName({ underlying: "BTC" }, 81)).toBe("Bitcoin 81");
    expect(deriveMarketName({}, 81)).toBe("Outcome 81");
  });

  test("no class + meaningful rawName -> uses the rawName (macro/event markets)", () => {
    expect(deriveMarketName({}, 104, "June Fed rate change")).toBe("June Fed rate change");
    expect(deriveMarketName({}, 19, "May CPI year-over-year")).toBe("May CPI year-over-year");
  });

  test("no class + template rawName -> ignores template, falls back to id", () => {
    expect(deriveMarketName({}, 81, "Recurring")).toBe("Outcome 81");
    expect(deriveMarketName({}, 96, "Recurring Fallback")).toBe("Outcome 96");
    expect(deriveMarketName({}, 97, "Recurring Named Outcome")).toBe("Outcome 97");
    expect(deriveMarketName({}, 100, "Fallback")).toBe("Outcome 100");
    expect(deriveMarketName({ underlying: "BTC" }, 81, "  ")).toBe("Bitcoin 81");
  });

  test("class branches ignore rawName (always the Recurring template)", () => {
    expect(
      deriveMarketName({ class: "priceBinary", underlying: "BTC", period: "1d" }, 95, "Recurring")
    ).toBe("Bitcoin Up or Down Daily");
    expect(
      deriveMarketName({ class: "priceBucket", underlying: "BTC", period: "1d" }, 18, "Recurring")
    ).toBe("Bitcoin Multi Outcomes Daily");
  });

  test("trims trailing space when period missing", () => {
    expect(deriveMarketName({ class: "priceBinary", underlying: "BTC" }, 80)).toBe(
      "Bitcoin Up or Down"
    );
  });
});

describe("bucketLegLabel", () => {
  const thresholds = [75902, 79000];

  test("first leg is a less-than label", () => {
    expect(bucketLegLabel(thresholds, 0)).toBe("< $75,902");
  });

  test("middle leg is a range with an en-dash", () => {
    expect(bucketLegLabel(thresholds, 1)).toBe("$75,902–$79,000");
  });

  test("last leg is a greater-than label", () => {
    expect(bucketLegLabel(thresholds, 2)).toBe("> $79,000");
  });
});

describe("legLabel", () => {
  test("uses threshold label when thresholds exist (pipe priceBucket)", () => {
    expect(legLabel([75815, 78910], 0, "Recurring Named Outcome", 97)).toBe("< $75,815");
    expect(legLabel([75815, 78910], 1, "Recurring Named Outcome", 98)).toBe("$75,815–$78,910");
    expect(legLabel([75815, 78910], 2, "Recurring Named Outcome", 99)).toBe("> $78,910");
  });

  test("uses the named outcome's name when there are no thresholds (prose question)", () => {
    expect(legLabel([], 0, "Below 4.3%", 101)).toBe("Below 4.3%");
    expect(legLabel([], 1, "Exactly 4.3%", 102)).toBe("Exactly 4.3%");
  });

  test("falls back to Outcome <id> when no thresholds and name is a template or empty", () => {
    expect(legLabel([], 0, "Recurring Named Outcome", 101)).toBe("Outcome 101");
    expect(legLabel([], 0, undefined, 101)).toBe("Outcome 101");
    expect(legLabel([], 0, "  ", 101)).toBe("Outcome 101");
  });
});
