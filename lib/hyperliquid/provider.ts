import { createFixtureMarketDataProvider } from "./fixture-provider";
import { createLiveMarketDataProvider } from "./live-provider";
import type { Market, MarketSnapshot, TapeEvent } from "./types";

export type MarketDataProvider = {
  source: "fixture" | "live";
  getMarkets(): Promise<Market[]>;
  getMarket(marketId: string): Promise<Market | null>;
  getSnapshots(marketId?: string): Promise<MarketSnapshot[]>;
  getTapeEvents(marketId?: string): Promise<TapeEvent[]>;
};

type ProviderEnv = Record<string, string | undefined>;

// Intentional module-level singleton: the live provider owns a per-instance TTL
// cache, and sharing one instance across requests lets that cache dedupe the
// many browser clients polling every few seconds. Module scope is shared across
// requests within a server instance and resets on cold start, which is fine.
const liveProvider = createLiveMarketDataProvider();

export function getMarketDataProvider(env: ProviderEnv = process.env): MarketDataProvider {
  if (env.HYPERTAPE_DATA_SOURCE === "fixture") {
    return createFixtureMarketDataProvider();
  }

  return liveProvider;
}
