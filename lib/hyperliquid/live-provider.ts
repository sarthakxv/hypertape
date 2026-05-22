import {
  createHyperliquidClient,
  createTtlCache,
  mapWithConcurrency,
  type AllMids,
  type Candle,
  type HyperliquidClient,
  type L2Book,
  type L2BookLevel,
  type TtlCache
} from "./hyperliquid-client";
import { normalizeOutcomeMeta } from "./normalize-outcome-meta";
import type { MarketDataProvider } from "./provider";
import type { BookLevel, Market, MarketSnapshot, TapeEvent } from "./types";
import { calculateMid, calculateSpread } from "@/lib/markets/probability";
import { depthWithinPoints } from "@/lib/markets/depth";
import { generateProbabilityMoveEvents, rankTapeEvents } from "@/lib/tape/event-engine";

const QUOTE_TTL_MS = 3_000;
const CANDLE_TTL_MS = 20_000;
const CANDLE_INTERVAL = "1m";
const CANDLE_LOOKBACK_MS = 60 * 60_000;
const MOVE_WINDOWS_SECONDS = [5 * 60, 15 * 60];
const FAN_OUT_LIMIT = 6;

export type LiveProviderOptions = {
  client?: HyperliquidClient;
  now?: () => number;
};

function toBookLevels(levels: L2BookLevel[]): BookLevel[] {
  return levels.map((level) => ({ price: Number(level.px), size: Number(level.sz) }));
}

function bestPrice(levels: L2BookLevel[]): number | null {
  return levels.length > 0 ? Number(levels[0].px) : null;
}

function primaryCoin(market: Market): string {
  const side = market.sides.find((candidate) => candidate.side === market.primarySide);
  return side?.coin ?? market.sides[0].coin;
}

/**
 * Builds the single live "current" snapshot for a market from its primary-side L2
 * book. The dual mid is taken from allMids when available; dual best bid/ask stay
 * null (we only fetch the primary book). Empty books yield null quote/depth.
 */
function buildCurrentSnapshot(market: Market, primaryBook: L2Book, allMids: AllMids): MarketSnapshot {
  const [rawBids, rawAsks] = primaryBook.levels;
  const bids = toBookLevels(rawBids);
  const asks = toBookLevels(rawAsks);

  const primaryBestBid = bestPrice(rawBids);
  const primaryBestAsk = bestPrice(rawAsks);
  const primaryMid = calculateMid(primaryBestBid, primaryBestAsk);
  const canonicalSpread = calculateSpread(primaryBestBid, primaryBestAsk);

  const dualSideSpec = market.sides.find((candidate) => candidate.side === market.dualSide);
  const dualMidRaw = dualSideSpec ? allMids[dualSideSpec.coin] : undefined;
  const dualMid = dualMidRaw !== undefined ? Number(dualMidRaw) : null;

  const oneBand = primaryMid != null ? depthWithinPoints(bids, asks, primaryMid, 1) : null;
  const threeBand = primaryMid != null ? depthWithinPoints(bids, asks, primaryMid, 3) : null;
  const fiveBand = primaryMid != null ? depthWithinPoints(bids, asks, primaryMid, 5) : null;

  return {
    marketId: market.id,
    timestamp: primaryBook.time,
    primarySide: market.primarySide,
    primaryBestBid,
    primaryBestAsk,
    primaryMid,
    dualBestBid: null,
    dualBestAsk: null,
    dualMid,
    canonicalSpread,
    bidDepthOnePoint: oneBand?.bidDepth ?? null,
    askDepthOnePoint: oneBand?.askDepth ?? null,
    bidDepthThreePoints: threeBand?.bidDepth ?? null,
    askDepthThreePoints: threeBand?.askDepth ?? null,
    bidDepthFivePoints: fiveBand?.bidDepth ?? null,
    askDepthFivePoints: fiveBand?.askDepth ?? null,
    totalDepthOnePoint: oneBand?.totalDepth ?? null,
    totalDepthThreePoints: threeBand?.totalDepth ?? null,
    totalDepthFivePoints: fiveBand?.totalDepth ?? null,
    recentVolume: null,
    recentTradeCount: null,
    lastBookUpdateAt: primaryBook.time,
    lastTradeAt: null,
    bids,
    asks
  };
}

/**
 * Maps a candle close into a mid-only history snapshot. Bid/ask/dual/depth/spread
 * are null because a candle only carries the probability mid at its open time.
 */
function buildCandleSnapshot(market: Market, candle: Candle): MarketSnapshot {
  return {
    marketId: market.id,
    timestamp: candle.t,
    primarySide: market.primarySide,
    primaryBestBid: null,
    primaryBestAsk: null,
    primaryMid: Number(candle.c),
    dualBestBid: null,
    dualBestAsk: null,
    dualMid: null,
    canonicalSpread: null,
    bidDepthOnePoint: null,
    askDepthOnePoint: null,
    bidDepthThreePoints: null,
    askDepthThreePoints: null,
    bidDepthFivePoints: null,
    askDepthFivePoints: null,
    totalDepthOnePoint: null,
    totalDepthThreePoints: null,
    totalDepthFivePoints: null,
    recentVolume: null,
    recentTradeCount: null,
    lastBookUpdateAt: null,
    lastTradeAt: null,
    bids: [],
    asks: []
  };
}

export function createLiveMarketDataProvider(options: LiveProviderOptions = {}): MarketDataProvider {
  const now = options.now ?? Date.now;
  const client = options.client ?? createHyperliquidClient();
  const cache: TtlCache = createTtlCache(now);

  function fetchAllMidsCached(): Promise<AllMids> {
    return cache.get("allMids", QUOTE_TTL_MS, () => client.fetchAllMids());
  }

  function fetchL2BookCached(coin: string): Promise<L2Book> {
    return cache.get(`l2Book:${coin}`, QUOTE_TTL_MS, () => client.fetchL2Book(coin));
  }

  function fetchPrimaryCandlesCached(market: Market): Promise<Candle[]> {
    const coin = primaryCoin(market);
    return cache.get(`candles:${coin}`, CANDLE_TTL_MS, () => {
      const endTime = now();
      return client.fetchCandles(coin, CANDLE_INTERVAL, endTime - CANDLE_LOOKBACK_MS, endTime);
    });
  }

  async function getMarkets(): Promise<Market[]> {
    const timestamp = now();
    const meta = await client.fetchOutcomeMeta();
    return meta.outcomes.map((outcome) => normalizeOutcomeMeta(outcome, timestamp));
  }

  async function getMarket(marketId: string): Promise<Market | null> {
    const markets = await getMarkets();
    return markets.find((market) => market.id === marketId) ?? null;
  }

  async function getSnapshotsForMarket(market: Market): Promise<MarketSnapshot[]> {
    const [candles, primaryBook, allMids] = await Promise.all([
      fetchPrimaryCandlesCached(market),
      fetchL2BookCached(primaryCoin(market)),
      fetchAllMidsCached()
    ]);

    const history = candles.map((candle) => buildCandleSnapshot(market, candle));
    const current = buildCurrentSnapshot(market, primaryBook, allMids);

    return [...history, current].sort((a, b) => a.timestamp - b.timestamp);
  }

  async function getSnapshots(marketId?: string): Promise<MarketSnapshot[]> {
    if (marketId != null) {
      const market = await getMarket(marketId);
      if (!market) return [];
      return getSnapshotsForMarket(market);
    }

    const markets = await getMarkets();
    const allMids = await fetchAllMidsCached();
    const results = await mapWithConcurrency(markets, FAN_OUT_LIMIT, async (market) => {
      try {
        const primaryBook = await fetchL2BookCached(primaryCoin(market));
        return buildCurrentSnapshot(market, primaryBook, allMids);
      } catch {
        // Isolate per-market failures so one bad market does not blank the list.
        return null;
      }
    });
    return results.filter((snapshot): snapshot is MarketSnapshot => snapshot !== null);
  }

  async function getTapeEventsForMarket(market: Market): Promise<TapeEvent[]> {
    const candles = await fetchPrimaryCandlesCached(market);
    const candleSnapshots = candles.map((candle) => buildCandleSnapshot(market, candle));

    return MOVE_WINDOWS_SECONDS.flatMap((windowSeconds) =>
      generateProbabilityMoveEvents([market], candleSnapshots, windowSeconds)
    );
  }

  async function getTapeEvents(marketId?: string): Promise<TapeEvent[]> {
    if (marketId != null) {
      const market = await getMarket(marketId);
      if (!market) return [];
      return rankTapeEvents(await getTapeEventsForMarket(market));
    }

    const markets = await getMarkets();
    const perMarket = await mapWithConcurrency(markets, FAN_OUT_LIMIT, async (market) => {
      try {
        return await getTapeEventsForMarket(market);
      } catch {
        // Isolate per-market failures so one bad market does not blank the feed.
        return [];
      }
    });

    return rankTapeEvents(perMarket.flat());
  }

  return {
    source: "live",
    getMarkets,
    getMarket,
    getSnapshots,
    getTapeEvents
  };
}
