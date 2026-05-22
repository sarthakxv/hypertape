import { describe, expect, test } from "vitest";
import { buildMarketsFromOutcomeMeta } from "@/lib/hyperliquid/normalize-outcome-meta";
import type { AllMids, RawOutcomeMetaResponse } from "@/lib/hyperliquid/hyperliquid-client";
import type { BucketMarket, Market } from "@/lib/hyperliquid/types";
import outcomeMeta from "./fixtures/hyperliquid/outcome-meta.json";
import allMids from "./fixtures/hyperliquid/all-mids-outcomes.json";

const NOW = Date.parse("2026-05-23T05:00:00.000Z");

function build() {
  return buildMarketsFromOutcomeMeta(
    outcomeMeta as RawOutcomeMetaResponse,
    allMids as AllMids,
    NOW
  );
}

describe("buildMarketsFromOutcomeMeta", () => {
  test("emits one binary card for outcome 80 with a derived name and Up/Down sides", () => {
    const cards = build();
    const binary = cards.find((card): card is Market => card.kind === "binary" && card.id === "80");

    expect(binary).toBeDefined();
    expect(binary?.name).toBe("Bitcoin Up or Down Daily");
    expect(binary?.sides.map((side) => side.label)).toEqual(["Up", "Down"]);
  });

  test("drops the fallback outcome (81) and folds named outcomes (82,83,84) into the bucket", () => {
    const cards = build();
    const binaryIds = cards.filter((card) => card.kind === "binary").map((card) => card.id);

    expect(binaryIds).toContain("80");
    expect(binaryIds).not.toContain("81");
    expect(binaryIds).not.toContain("82");
    expect(binaryIds).not.toContain("83");
    expect(binaryIds).not.toContain("84");
  });

  test("emits a bucket card for question 15 with labeled legs and live probabilities", () => {
    const cards = build();
    const bucket = cards.find((card): card is BucketMarket => card.kind === "bucket");

    expect(bucket).toBeDefined();
    expect(bucket?.id).toBe("q15");
    expect(bucket?.questionId).toBe(15);
    expect(bucket?.name).toBe("Bitcoin Multi Outcomes Daily");
    expect(bucket?.priceThresholds).toEqual([75902, 79000]);

    const legs = bucket?.legs ?? [];
    expect(legs.map((leg) => leg.label)).toEqual([
      "< $75,902",
      "$75,902–$79,000",
      "> $79,000"
    ]);
    expect(legs.map((leg) => leg.outcomeId)).toEqual([82, 83, 84]);
    expect(legs.map((leg) => leg.yesCoin)).toEqual(["#820", "#830", "#840"]);

    expect(legs[0].probability).toBeCloseTo(0.62835, 5);
    expect(legs[1].probability).toBeCloseTo(0.368095, 5);
    expect(legs[2].probability).toBeCloseTo(0.0063, 5);
  });

  test("leg probability is null when the mid is absent", () => {
    const cards = buildMarketsFromOutcomeMeta(outcomeMeta as RawOutcomeMetaResponse, {}, NOW);
    const bucket = cards.find((card): card is BucketMarket => card.kind === "bucket");
    expect(bucket?.legs.every((leg) => leg.probability === null)).toBe(true);
  });
});
