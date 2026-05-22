import { describe, expect, test } from "vitest";
import { createLiveMarketDataProvider } from "@/lib/hyperliquid/live-provider";
import type {
  AllMids,
  Candle,
  HyperliquidClient,
  L2Book,
  RawOutcomeMetaResponse,
  Trade
} from "@/lib/hyperliquid/hyperliquid-client";
import outcomeMeta from "./fixtures/hyperliquid/outcome-meta.json";
import allMids from "./fixtures/hyperliquid/all-mids-outcomes.json";
import l2book800 from "./fixtures/hyperliquid/l2book-800.json";
import l2book801 from "./fixtures/hyperliquid/l2book-801.json";
import candle8001m from "./fixtures/hyperliquid/candle-800-1m.json";
import recentTrades800 from "./fixtures/hyperliquid/recent-trades-800.json";

const NOW = Date.parse("2026-05-23T05:00:00.000Z");

function l2BookFor(coin: string): L2Book {
  return coin === "#801" ? (l2book801 as L2Book) : (l2book800 as L2Book);
}

type FakeClientOverrides = Partial<HyperliquidClient>;

function createFakeClient(overrides: FakeClientOverrides = {}): HyperliquidClient {
  return {
    async fetchOutcomeMeta(): Promise<RawOutcomeMetaResponse> {
      return outcomeMeta as RawOutcomeMetaResponse;
    },
    async fetchAllMids(): Promise<AllMids> {
      return allMids as AllMids;
    },
    async fetchL2Book(coin: string): Promise<L2Book> {
      return l2BookFor(coin);
    },
    async fetchCandles(): Promise<Candle[]> {
      return candle8001m as Candle[];
    },
    async fetchRecentTrades(): Promise<Trade[]> {
      return recentTrades800 as Trade[];
    },
    ...overrides
  };
}

function createProvider(overrides: FakeClientOverrides = {}) {
  return createLiveMarketDataProvider({ client: createFakeClient(overrides), now: () => NOW });
}

describe("live market data provider", () => {
  test("getMarkets models binary outcomes and bucket questions like outcome.xyz", async () => {
    const provider = createProvider();
    const markets = await provider.getMarkets();

    expect(provider.source).toBe("live");

    const binary80 = markets.find((market) => market.id === "80");
    expect(binary80?.kind).toBe("binary");
    expect(binary80?.name).toBe("Bitcoin Up or Down Daily");

    // Fallback outcome 81 is hidden; named outcomes 82-84 are folded into the bucket.
    const ids = markets.map((market) => market.id);
    expect(ids).not.toContain("81");
    expect(ids).not.toContain("82");

    const bucket = markets.find((market) => market.kind === "bucket");
    expect(bucket).toBeDefined();
    if (bucket?.kind === "bucket") {
      expect(bucket.id).toBe("q15");
      expect(bucket.name).toBe("Bitcoin Multi Outcomes Daily");
      expect(bucket.legs.map((leg) => leg.label)).toEqual([
        "< $75,902",
        "$75,902–$79,000",
        "> $79,000"
      ]);
      expect(bucket.legs[0].probability).toBeCloseTo(0.62835, 5);
    }
  });

  test("getSnapshots(id) returns candle history points plus a live current snapshot", async () => {
    const provider = createProvider();
    const snapshots = await provider.getSnapshots("80");

    expect(snapshots.length).toBeGreaterThan(candle8001m.length);

    const sortedAscending = snapshots.every(
      (snapshot, index) => index === 0 || snapshots[index - 1].timestamp <= snapshot.timestamp
    );
    expect(sortedAscending).toBe(true);

    const historyPoints = snapshots.slice(0, candle8001m.length);
    for (const point of historyPoints) {
      expect(point.primaryMid).not.toBeNull();
      expect(point.primaryBestBid).toBeNull();
      expect(point.primaryBestAsk).toBeNull();
    }

    const current = snapshots[snapshots.length - 1];
    expect(current.primaryBestBid).not.toBeNull();
    expect(current.primaryBestAsk).not.toBeNull();
    expect(current.primaryMid).not.toBeNull();
    expect(current.canonicalSpread).not.toBeNull();
    expect(current.totalDepthOnePoint).not.toBeNull();
    expect(current.bids.length).toBeGreaterThan(0);
    expect(current.asks.length).toBeGreaterThan(0);
    expect(current.lastBookUpdateAt).toBe((l2book800 as L2Book).time);
  });

  test("getSnapshots() returns one current snapshot per binary market without throwing", async () => {
    const provider = createProvider();
    const markets = await provider.getMarkets();
    const binaryCount = markets.filter((market) => market.kind === "binary").length;
    const snapshots = await provider.getSnapshots();

    expect(snapshots).toHaveLength(binaryCount);
    const marketIds = new Set(snapshots.map((snapshot) => snapshot.marketId));
    expect(marketIds.size).toBe(binaryCount);
  });

  test("getSnapshots(bucketId) returns no snapshots", async () => {
    const provider = createProvider();
    const snapshots = await provider.getSnapshots("q15");
    expect(snapshots).toHaveLength(0);
  });

  test("getSnapshots() drops a binary market whose book fetch rejects and keeps survivors", async () => {
    // "#800" is the primary coin for market 80; rejecting it drops that one market.
    const provider = createProvider({
      async fetchL2Book(coin: string): Promise<L2Book> {
        if (coin === "#800") {
          throw new Error("book fetch failed");
        }
        return l2BookFor(coin);
      }
    });

    const markets = await provider.getMarkets();
    const binaryCount = markets.filter((market) => market.kind === "binary").length;

    const snapshots = await provider.getSnapshots();

    expect(snapshots).toHaveLength(binaryCount - 1);
    expect(snapshots.some((snapshot) => snapshot.marketId === "80")).toBe(false);
  });

  test("getTapeEvents(id) derives probability_move events from a qualifying candle history", async () => {
    const base = 1779481020000;
    const syntheticCandles: Candle[] = [
      { t: base, T: base + 59_999, s: "#800", i: "1m", o: "0.42", c: "0.42", h: "0.42", l: "0.42", v: "100", n: 1 },
      {
        t: base + 5 * 60_000,
        T: base + 5 * 60_000 + 59_999,
        s: "#800",
        i: "1m",
        o: "0.478",
        c: "0.478",
        h: "0.478",
        l: "0.42",
        v: "100",
        n: 1
      }
    ];

    const provider = createProvider({
      async fetchCandles(): Promise<Candle[]> {
        return syntheticCandles;
      }
    });

    const events = await provider.getTapeEvents("80");

    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((event) => event.eventType === "probability_move")).toBe(true);
    expect(events[0].marketId).toBe("80");
  });
});
