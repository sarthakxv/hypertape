import { normalizeOutcomeMeta, type RawOutcomeMeta } from "./normalize-outcome-meta";
import type { MarketDataProvider } from "./provider";
import type { Market, MarketSnapshot, TapeEvent } from "./types";

const HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRawOutcomeMeta(value: unknown): value is RawOutcomeMeta {
  if (!isRecord(value)) return false;
  return value.outcomeId !== undefined;
}

function extractOutcomeMetaList(responseBody: unknown): unknown[] {
  if (Array.isArray(responseBody)) return responseBody;
  if (!isRecord(responseBody)) return [];

  for (const field of ["markets", "universe", "outcomes", "data"]) {
    const value = responseBody[field];
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      const nested = extractOutcomeMetaList(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
}

async function fetchOutcomeMeta(fetchImpl: typeof fetch): Promise<RawOutcomeMeta[]> {
  const response = await fetchImpl(HYPERLIQUID_INFO_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "outcomeMeta" })
  });

  if (!response.ok) {
    throw new Error(`Hyperliquid outcomeMeta request failed with status ${response.status}`);
  }

  const responseBody = await response.json();
  const rawMarkets = extractOutcomeMetaList(responseBody).filter(isRawOutcomeMeta);

  if (rawMarkets.length === 0) {
    throw new Error("Hyperliquid outcomeMeta response did not include markets");
  }

  return rawMarkets;
}

export function createLiveMarketDataProvider(fetchImpl: typeof fetch = fetch): MarketDataProvider {
  async function getMarkets(): Promise<Market[]> {
    const timestamp = Date.now();
    const rawMarkets = await fetchOutcomeMeta(fetchImpl);
    return rawMarkets.map((metadata) => normalizeOutcomeMeta(metadata, timestamp));
  }

  return {
    source: "live",
    getMarkets,
    async getMarket(marketId: string): Promise<Market | null> {
      const markets = await getMarkets();
      return markets.find((market) => market.id === marketId) ?? null;
    },
    async getSnapshots(): Promise<MarketSnapshot[]> {
      throw new Error("Live market snapshots are not implemented");
    },
    async getTapeEvents(): Promise<TapeEvent[]> {
      throw new Error("Live tape events are not implemented");
    }
  };
}
