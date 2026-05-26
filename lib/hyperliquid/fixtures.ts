import { depthWithinPoints } from "@/lib/markets/depth";
import { calculateMid, calculateSpread } from "@/lib/markets/probability";
import type { RawOutcomeMetaEntry } from "./hyperliquid-client";
import type { BookLevel, MarketSnapshot, TapeEvent } from "./types";

export const fixtureOutcomeMeta: RawOutcomeMetaEntry[] = [
  {
    // Future expiry relative to FIXTURE_NORMALIZED_AT -> derived status "active".
    outcome: 7,
    name: "BTC above 105k by 06:00 UTC",
    description: "class:priceBinary|underlying:BTC|expiry:20260523-0600|targetPrice:105000|period:1d",
    sideSpecs: [{ name: "Yes" }, { name: "No" }]
  },
  {
    outcome: 8,
    name: "HYPE closes green today",
    description: "class:priceBinary|underlying:HYPE|expiry:20260524-0000|targetPrice:30|period:1d",
    sideSpecs: [{ name: "Yes" }, { name: "No" }]
  },
  {
    outcome: 9,
    name: "SOL above 180 by Friday close",
    description: "class:priceBinary|underlying:SOL|expiry:20260524-2000|targetPrice:180|period:1w",
    sideSpecs: [{ name: "Up" }, { name: "Down" }]
  }
];

const FIXTURE_NOW = Date.parse("2026-05-22T12:00:00.000Z");

// Plausible underlying spot per fixture market (7=BTC, 8=HYPE, 9=SOL) so fixture
// mode renders the Target/Current/Δ widget. targetPrices: 7→105000, 8→30, 9→180.
const FIXTURE_UNDERLYING_SPOT: Record<string, number> = {
  "7": 103500,
  "8": 28.5,
  "9": 192
};

function round(value: number): number {
  return Number(value.toFixed(4));
}

function bestBid(bids: BookLevel[]): number | null {
  return bids[0]?.price ?? null;
}

function bestAsk(asks: BookLevel[]): number | null {
  return asks[0]?.price ?? null;
}

function makeSnapshot(
  marketId: string,
  timestamp: number,
  primarySide: 0 | 1,
  bids: BookLevel[],
  asks: BookLevel[],
  recentVolume: number,
  recentTradeCount: number
): MarketSnapshot {
  const primaryBestBid = bestBid(bids);
  const primaryBestAsk = bestAsk(asks);
  const primaryMid = calculateMid(primaryBestBid, primaryBestAsk);
  const dualBestBid = primaryBestAsk == null ? null : round(1 - primaryBestAsk);
  const dualBestAsk = primaryBestBid == null ? null : round(1 - primaryBestBid);
  const dualMid = calculateMid(dualBestBid, dualBestAsk);
  const canonicalSpread = calculateSpread(primaryBestBid, primaryBestAsk);
  const depthOne = primaryMid == null ? null : depthWithinPoints(bids, asks, primaryMid, 1);
  const depthThree = primaryMid == null ? null : depthWithinPoints(bids, asks, primaryMid, 3);
  const depthFive = primaryMid == null ? null : depthWithinPoints(bids, asks, primaryMid, 5);

  return {
    marketId,
    timestamp,
    primarySide,
    primaryBestBid,
    primaryBestAsk,
    primaryMid,
    dualBestBid,
    dualBestAsk,
    dualMid,
    canonicalSpread,
    bidDepthOnePoint: depthOne?.bidDepth ?? null,
    askDepthOnePoint: depthOne?.askDepth ?? null,
    bidDepthThreePoints: depthThree?.bidDepth ?? null,
    askDepthThreePoints: depthThree?.askDepth ?? null,
    bidDepthFivePoints: depthFive?.bidDepth ?? null,
    askDepthFivePoints: depthFive?.askDepth ?? null,
    totalDepthOnePoint: depthOne?.totalDepth ?? null,
    totalDepthThreePoints: depthThree?.totalDepth ?? null,
    totalDepthFivePoints: depthFive?.totalDepth ?? null,
    recentVolume,
    recentTradeCount,
    underlyingSpot: FIXTURE_UNDERLYING_SPOT[marketId] ?? null,
    lastBookUpdateAt: timestamp,
    lastTradeAt: timestamp - 20_000,
    bids,
    asks
  };
}

export const fixtureMarketSnapshots: MarketSnapshot[] = [
  makeSnapshot(
    "7",
    FIXTURE_NOW - 5 * 60_000,
    0,
    [
      { price: 0.42, size: 1200 },
      { price: 0.415, size: 1800 },
      { price: 0.405, size: 2200 }
    ],
    [
      { price: 0.44, size: 900 },
      { price: 0.445, size: 1400 },
      { price: 0.455, size: 1800 }
    ],
    84_000,
    42
  ),
  makeSnapshot(
    "7",
    FIXTURE_NOW,
    0,
    [
      { price: 0.485, size: 1500 },
      { price: 0.48, size: 2100 },
      { price: 0.47, size: 2400 }
    ],
    [
      { price: 0.505, size: 1100 },
      { price: 0.51, size: 1600 },
      { price: 0.52, size: 1900 }
    ],
    131_000,
    71
  ),
  makeSnapshot(
    "8",
    FIXTURE_NOW - 5 * 60_000,
    0,
    [
      { price: 0.56, size: 2400 },
      { price: 0.55, size: 2600 },
      { price: 0.535, size: 3000 }
    ],
    [
      { price: 0.58, size: 1900 },
      { price: 0.59, size: 2300 },
      { price: 0.605, size: 3200 }
    ],
    67_500,
    38
  ),
  makeSnapshot(
    "8",
    FIXTURE_NOW,
    0,
    [
      { price: 0.61, size: 2100 },
      { price: 0.6, size: 2500 },
      { price: 0.59, size: 2800 }
    ],
    [
      { price: 0.63, size: 1800 },
      { price: 0.64, size: 2100 },
      { price: 0.655, size: 2700 }
    ],
    92_000,
    54
  ),
  makeSnapshot(
    "9",
    FIXTURE_NOW - 5 * 60_000,
    0,
    [
      { price: 0.34, size: 1700 },
      { price: 0.33, size: 2100 },
      { price: 0.315, size: 2500 }
    ],
    [
      { price: 0.36, size: 1600 },
      { price: 0.37, size: 1900 },
      { price: 0.385, size: 2600 }
    ],
    41_000,
    29
  ),
  makeSnapshot(
    "9",
    FIXTURE_NOW,
    0,
    [
      { price: 0.365, size: 1900 },
      { price: 0.355, size: 2200 },
      { price: 0.34, size: 2600 }
    ],
    [
      { price: 0.385, size: 1700 },
      { price: 0.395, size: 2100 },
      { price: 0.41, size: 2700 }
    ],
    55_500,
    36
  )
];

export const fixtureTapeEvents: TapeEvent[] = [
  {
    id: "fixture-7-probability-move",
    marketId: "7",
    timestamp: FIXTURE_NOW,
    eventType: "probability_move",
    side: "Yes",
    previousProbability: 0.43,
    currentProbability: 0.495,
    delta: 0.065,
    windowSeconds: 300,
    severity: "medium",
    title: "BTC above 105k moved higher",
    summary: "Yes probability rose 6.5 points over five minutes as bids stepped up."
  },
  {
    id: "fixture-8-spread-tightened",
    marketId: "8",
    timestamp: FIXTURE_NOW - 60_000,
    eventType: "spread_tightened",
    spread: 0.02,
    depth: 2_415,
    severity: "low",
    title: "HYPE market tightened",
    summary: "Top-of-book spread compressed to two points with stronger bid depth."
  },
  {
    id: "fixture-9-new-market",
    marketId: "9",
    timestamp: FIXTURE_NOW - 8 * 60_000,
    eventType: "new_market",
    severity: "low",
    title: "SOL market listed",
    summary: "SOL above 180 by Friday close is now available with initial two-sided depth."
  }
];
