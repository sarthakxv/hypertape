import { describe, expect, test } from "vitest";
import {
  bucketLegLabel,
  deriveMarketName,
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
