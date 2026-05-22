import { createFixtureMarketDataProvider } from "./fixture-provider";
import { createLiveMarketDataProvider } from "./live-provider";
import type { Market, MarketSnapshot, TapeEvent } from "./types";

export type MarketDataProvider = {
  source: "fixture" | "live" | "live-with-fixture-fallback";
  getMarkets(): Promise<Market[]>;
  getMarket(marketId: string): Promise<Market | null>;
  getSnapshots(marketId?: string): Promise<MarketSnapshot[]>;
  getTapeEvents(marketId?: string): Promise<TapeEvent[]>;
};

type ProviderEnv = Record<string, string | undefined>;

function createFixtureFallbackProvider(): MarketDataProvider {
  const fixtureProvider = createFixtureMarketDataProvider();

  return {
    source: "live-with-fixture-fallback",
    getMarkets: fixtureProvider.getMarkets,
    getMarket: fixtureProvider.getMarket,
    getSnapshots: fixtureProvider.getSnapshots,
    getTapeEvents: fixtureProvider.getTapeEvents
  };
}

function createLiveProviderWithFixtureFallback(): MarketDataProvider {
  const liveProvider = createLiveMarketDataProvider();
  const fixtureProvider = createFixtureMarketDataProvider();
  let didFallback = false;

  return {
    get source() {
      return didFallback ? "live-with-fixture-fallback" : "live";
    },
    async getMarkets(): Promise<Market[]> {
      if (didFallback) return fixtureProvider.getMarkets();
      try {
        return await liveProvider.getMarkets();
      } catch {
        didFallback = true;
        return fixtureProvider.getMarkets();
      }
    },
    async getMarket(marketId: string): Promise<Market | null> {
      if (didFallback) return fixtureProvider.getMarket(marketId);
      try {
        return await liveProvider.getMarket(marketId);
      } catch {
        didFallback = true;
        return fixtureProvider.getMarket(marketId);
      }
    },
    async getSnapshots(marketId?: string): Promise<MarketSnapshot[]> {
      if (didFallback) return fixtureProvider.getSnapshots(marketId);
      try {
        return await liveProvider.getSnapshots(marketId);
      } catch {
        didFallback = true;
        return fixtureProvider.getSnapshots(marketId);
      }
    },
    async getTapeEvents(marketId?: string): Promise<TapeEvent[]> {
      if (didFallback) return fixtureProvider.getTapeEvents(marketId);
      try {
        return await liveProvider.getTapeEvents(marketId);
      } catch {
        didFallback = true;
        return fixtureProvider.getTapeEvents(marketId);
      }
    }
  };
}

export function getMarketDataProvider(env: ProviderEnv = process.env): MarketDataProvider {
  if (env.HYPERTAPE_DATA_SOURCE !== "live") {
    return createFixtureMarketDataProvider();
  }

  if (env.HYPERTAPE_FORCE_LIVE_FAILURE === "1") {
    return createFixtureFallbackProvider();
  }

  return createLiveProviderWithFixtureFallback();
}
