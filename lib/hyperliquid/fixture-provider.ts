import { fixtureMarketSnapshots, fixtureOutcomeMeta, fixtureTapeEvents } from "./fixtures";
import { normalizeOutcomeMeta } from "./normalize-outcome-meta";
import type { MarketDataProvider } from "./provider";
import type { Market, MarketSnapshot, TapeEvent } from "./types";

const FIXTURE_NORMALIZED_AT = Date.parse("2026-05-22T12:00:00.000Z");

function cloneSnapshot(snapshot: MarketSnapshot): MarketSnapshot {
  return {
    ...snapshot,
    bids: snapshot.bids.map((level) => ({ ...level })),
    asks: snapshot.asks.map((level) => ({ ...level }))
  };
}

function cloneMarket(market: Market): Market {
  return structuredClone(market);
}

function cloneTapeEvent(event: TapeEvent): TapeEvent {
  return { ...event };
}

export function createFixtureMarketDataProvider(): MarketDataProvider {
  const markets = fixtureOutcomeMeta.map((metadata) => normalizeOutcomeMeta(metadata, FIXTURE_NORMALIZED_AT));

  return {
    source: "fixture",
    async getMarkets(): Promise<Market[]> {
      return markets.map(cloneMarket);
    },
    async getMarket(marketId: string): Promise<Market | null> {
      const market = markets.find((candidate) => candidate.id === marketId);
      return market ? cloneMarket(market) : null;
    },
    async getSnapshots(marketId?: string): Promise<MarketSnapshot[]> {
      return fixtureMarketSnapshots
        .filter((snapshot) => marketId == null || snapshot.marketId === marketId)
        .map(cloneSnapshot);
    },
    async getTapeEvents(marketId?: string): Promise<TapeEvent[]> {
      return fixtureTapeEvents
        .filter((event) => marketId == null || event.marketId === marketId)
        .map(cloneTapeEvent);
    }
  };
}
