"use client";

import { MarketsTable } from "@/components/markets/markets-table";
import { useLiveData } from "@/lib/hooks/use-live-data";
import type { MarketCard, MarketSnapshot, TapeEvent } from "@/lib/hyperliquid/types";

const LIVE_REFRESH_MS = 3000;

type MarketsResponse = {
  source: string;
  markets: MarketCard[];
  snapshots: MarketSnapshot[];
  error?: string;
};

type MarketsTableLiveProps = {
  markets: MarketCard[];
  snapshots: MarketSnapshot[];
  events: TapeEvent[];
};

export function MarketsTableLive({ markets, snapshots, events }: MarketsTableLiveProps) {
  // Reject error envelopes that arrive with no markets; the hook keeps last good.
  const marketsPayload = useLiveData<MarketsResponse>(
    "/api/markets",
    { source: "live", markets, snapshots },
    LIVE_REFRESH_MS,
    (payload) => !(payload.error && payload.markets.length === 0)
  );
  const tapePayload = useLiveData<{ source: string; events: TapeEvent[]; error?: string }>(
    "/api/tape",
    { source: "live", events },
    LIVE_REFRESH_MS,
    (payload) => !(payload.error && payload.events.length === 0)
  );

  return (
    <MarketsTable
      markets={marketsPayload.markets}
      snapshots={marketsPayload.snapshots}
      events={tapePayload.events}
    />
  );
}
