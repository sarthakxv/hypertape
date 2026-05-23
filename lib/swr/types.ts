import type { MarketCard, MarketSnapshot, TapeEvent } from "@/lib/hyperliquid/types";

export type LiveResponse = {
  source: string;
  markets: MarketCard[];
  snapshots: MarketSnapshot[];
  events: TapeEvent[];
  error?: string;
};

export type MarketDetailResponse = {
  source: string;
  market: MarketCard | null;
  snapshots: MarketSnapshot[];
  events: TapeEvent[];
  error?: string;
};

export const LIVE_KEY = "/api/live";

export function marketDetailKey(marketId: string): string {
  return `/api/markets/${marketId}`;
}
