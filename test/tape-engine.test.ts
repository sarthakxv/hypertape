import { describe, expect, test } from "vitest";
import { generateProbabilityMoveEvents, rankTapeEvents } from "@/lib/tape/event-engine";
import type { Market, MarketSnapshot } from "@/lib/hyperliquid/types";

const market = {
  id: "7",
  outcomeId: 7,
  name: "BTC above 105k by 06:00 UTC",
  sides: [
    { side: 0, label: "Yes", encoding: 70, coin: "#70", tokenName: "+70", assetId: 100000070 },
    { side: 1, label: "No", encoding: 71, coin: "#71", tokenName: "+71", assetId: 100000071 }
  ],
  primarySide: 0,
  dualSide: 1,
  status: "active",
  statusSource: "metadata",
  raw: {},
  createdAt: 1,
  updatedAt: 1
} satisfies Market;

function snapshot(timestamp: number, mid: number | null): MarketSnapshot {
  return {
    marketId: "7",
    timestamp,
    primarySide: 0,
    primaryBestBid: mid == null ? null : mid - 0.01,
    primaryBestAsk: mid == null ? null : mid + 0.01,
    primaryMid: mid,
    dualBestBid: mid == null ? null : 1 - mid - 0.01,
    dualBestAsk: mid == null ? null : 1 - mid + 0.01,
    dualMid: mid == null ? null : 1 - mid,
    canonicalSpread: 0.02,
    bidDepthOnePoint: 1000,
    askDepthOnePoint: 1200,
    bidDepthThreePoints: 2500,
    askDepthThreePoints: 2600,
    bidDepthFivePoints: 4000,
    askDepthFivePoints: 4200,
    totalDepthOnePoint: 2200,
    totalDepthThreePoints: 5100,
    totalDepthFivePoints: 8200,
    recentVolume: 9000,
    recentTradeCount: 14,
    lastBookUpdateAt: timestamp,
    lastTradeAt: timestamp,
    bids: [],
    asks: []
  };
}

describe("tape event engine", () => {
  test("generates a medium probability move event for a five point move", () => {
    const events = generateProbabilityMoveEvents([market], [snapshot(1000, 0.42), snapshot(1000 + 5 * 60_000, 0.478)], 5 * 60);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      marketId: "7",
      eventType: "probability_move",
      side: "Yes",
      previousProbability: 0.42,
      currentProbability: 0.478,
      severity: "medium"
    });
  });

  test("does not generate an event below the severity threshold", () => {
    const events = generateProbabilityMoveEvents([market], [snapshot(1000, 0.42), snapshot(1000 + 5 * 60_000, 0.431)], 5 * 60);

    expect(events).toHaveLength(0);
  });

  test("does not generate an event when a midpoint is missing", () => {
    const events = generateProbabilityMoveEvents([market], [snapshot(1000, 0.42), snapshot(1000 + 5 * 60_000, null)], 5 * 60);

    expect(events).toHaveLength(0);
  });

  test("does not generate stale events from snapshots outside the requested window", () => {
    const events = generateProbabilityMoveEvents([market], [snapshot(1000, 0.42), snapshot(1000 + 60 * 60_000, 0.58)], 5 * 60);

    expect(events).toHaveLength(0);
  });

  test("does not generate an event from a one-sided quote even when mid is stale", () => {
    const oneSidedSnapshot = {
      ...snapshot(1000 + 5 * 60_000, 0.478),
      primaryBestAsk: null
    };

    const events = generateProbabilityMoveEvents([market], [snapshot(1000, 0.42), oneSidedSnapshot], 5 * 60);

    expect(events).toHaveLength(0);
  });

  test("labels the move from the compared snapshot side", () => {
    const noSideSnapshot = {
      ...snapshot(1000, 0.52),
      primarySide: 1 as const
    };
    const movedNoSideSnapshot = {
      ...snapshot(1000 + 5 * 60_000, 0.58),
      primarySide: 1 as const
    };

    const events = generateProbabilityMoveEvents([market], [noSideSnapshot, movedNoSideSnapshot], 5 * 60);

    expect(events[0]?.side).toBe("No");
  });

  test("ranks higher severity and larger deltas first", () => {
    const ranked = rankTapeEvents([
      { id: "a", marketId: "7", timestamp: 10, eventType: "probability_move", severity: "low", delta: 0.03, title: "a", summary: "a" },
      { id: "b", marketId: "7", timestamp: 9, eventType: "probability_move", severity: "high", delta: 0.11, title: "b", summary: "b" }
    ]);

    expect(ranked[0].id).toBe("b");
  });
});
