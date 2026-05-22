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

export function getMarketDataProvider(env: ProviderEnv = process.env): MarketDataProvider {
  if (env.HYPERTAPE_DATA_SOURCE === "fixture") {
    return createFixtureMarketDataProvider();
  }

  return createLiveMarketDataProvider();
}
