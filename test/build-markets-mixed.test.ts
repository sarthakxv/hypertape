import { describe, expect, test } from "vitest";
import { buildMarketsFromOutcomeMeta } from "@/lib/hyperliquid/normalize-outcome-meta";
import type { AllMids, RawOutcomeMetaResponse } from "@/lib/hyperliquid/hyperliquid-client";
import type { BucketMarket, Market } from "@/lib/hyperliquid/types";
import outcomeMeta from "./fixtures/hyperliquid/outcome-meta-mixed.json";

// Before the BTC market's 06:00 expiry so it stays active.
const NOW = Date.parse("2026-05-26T05:00:00.000Z");

function build(mids: AllMids = {}) {
  return buildMarketsFromOutcomeMeta(outcomeMeta as RawOutcomeMetaResponse, mids, NOW);
}

describe("buildMarketsFromOutcomeMeta — mixed pipe/prose payload", () => {
  test("classifies markets by structure, not by description format", () => {
    const cards = build();
    const binaryIds = cards.filter((card) => card.kind === "binary").map((card) => card.id).sort();
    const bucketIds = cards.filter((card) => card.kind === "bucket").map((card) => card.id).sort();

    // Orphan outcomes (not named/fallback in any question) -> binaries: pipe 95, prose 104.
    expect(binaryIds).toEqual(["104", "95"]);
    // Every question is a bundle: pipe Q18, prose Q19. Named (97-99,101-103) + fallbacks (96,100) excluded.
    expect(bucketIds).toEqual(["q18", "q19"]);
  });

  test("builds the prose multi-outcome question (May CPI) as a bundle with name-derived legs", () => {
    const cards = build();
    const cpi = cards.find((card): card is BucketMarket => card.kind === "bucket" && card.id === "q19");

    expect(cpi).toBeDefined();
    expect(cpi?.questionId).toBe(19);
    expect(cpi?.name).toBe("May CPI year-over-year");
    // Prose questions carry no pipe priceThresholds.
    expect(cpi?.priceThresholds).toBeUndefined();
    expect(cpi?.underlying).toBeUndefined();

    const legs = cpi?.legs ?? [];
    // No thresholds -> labels come from each named outcome's own name, in API order.
    expect(legs.map((leg) => leg.label)).toEqual(["Below 4.3%", "Exactly 4.3%", "Above 4.3%"]);
    expect(legs.map((leg) => leg.outcomeId)).toEqual([101, 102, 103]);
    expect(legs.map((leg) => leg.yesCoin)).toEqual(["#1010", "#1020", "#1030"]);
  });

  test("prose leg probabilities flow from allMids by yes-coin", () => {
    const cards = build({ "#1010": "0.42", "#1020": "0.35", "#1030": "0.23" });
    const cpi = cards.find((card): card is BucketMarket => card.kind === "bucket" && card.id === "q19");
    expect(cpi?.legs.map((leg) => leg.probability)).toEqual([0.42, 0.35, 0.23]);
  });

  test("still labels pipe priceBucket legs by threshold (no regression)", () => {
    const cards = build();
    const btc = cards.find((card): card is BucketMarket => card.kind === "bucket" && card.id === "q18");
    expect(btc?.name).toBe("Bitcoin Multi Outcomes Daily");
    expect(btc?.priceThresholds).toEqual([75815, 78910]);
    expect(btc?.legs.map((leg) => leg.label)).toEqual([
      "< $75,815",
      "$75,815–$78,910",
      "> $78,910"
    ]);
  });

  test("builds the prose binary (June Fed) with its real name and unrelabeled sides", () => {
    const cards = build();
    const fed = cards.find((card): card is Market => card.kind === "binary" && card.id === "104");

    expect(fed).toBeDefined();
    expect(fed?.name).toBe("June Fed rate change");
    // class !== priceBinary, so Yes/No -> Up/Down relabel must NOT apply.
    expect(fed?.sides.map((side) => side.label)).toEqual(["Change", "No Change"]);
    expect(fed?.underlying).toBeUndefined();
    expect(fed?.targetPrice).toBeUndefined();
  });

  test("pipe priceBinary still relabels to Up/Down (no regression)", () => {
    const cards = build();
    const btc = cards.find((card): card is Market => card.kind === "binary" && card.id === "95");
    expect(btc?.name).toBe("Bitcoin Up or Down Daily");
    expect(btc?.sides.map((side) => side.label)).toEqual(["Up", "Down"]);
  });

  test("prose bundle with no expiry stays active via the expiry source", () => {
    const cards = build();
    const cpi = cards.find((card): card is BucketMarket => card.kind === "bucket" && card.id === "q19");
    expect(cpi?.status).toBe("active");
    expect(cpi?.statusSource).toBe("expiry");
  });

  test("marks a bundle settled from settledNamedOutcomes regardless of expiry", () => {
    const response: RawOutcomeMetaResponse = {
      outcomes: [
        { outcome: 101, name: "Below 4.3%", description: "Resolves Yes if below.", sideSpecs: [{ name: "Yes" }, { name: "No" }] },
        { outcome: 102, name: "Above 4.3%", description: "Resolves Yes if above.", sideSpecs: [{ name: "Yes" }, { name: "No" }] }
      ],
      questions: [
        {
          question: 19,
          name: "May CPI year-over-year",
          description: "prose, no expiry",
          namedOutcomes: [101, 102],
          settledNamedOutcomes: [102]
        }
      ]
    };
    const cards = buildMarketsFromOutcomeMeta(response, {}, NOW);
    const cpi = cards.find((card): card is BucketMarket => card.kind === "bucket" && card.id === "q19");
    expect(cpi?.status).toBe("settled");
    expect(cpi?.statusSource).toBe("metadata");
  });

  test("skips degenerate questions with no named outcomes", () => {
    const response: RawOutcomeMetaResponse = {
      outcomes: [
        { outcome: 5, name: "Standalone", description: "Resolves Yes if X.", sideSpecs: [{ name: "Yes" }, { name: "No" }] }
      ],
      questions: [
        { question: 1, name: "Empty bundle", description: "prose", namedOutcomes: [], settledNamedOutcomes: [] }
      ]
    };
    const cards = buildMarketsFromOutcomeMeta(response, {}, NOW);
    expect(cards.filter((card) => card.kind === "bucket")).toHaveLength(0);
    expect(cards.filter((card) => card.kind === "binary").map((card) => card.id)).toEqual(["5"]);
  });
});
