"use client";

import { useRef } from "react";
import { MarketsTable } from "@/components/markets/markets-table";
import { useLiveData } from "@/lib/hooks/use-live-data";
import type { Market, MarketSnapshot, TapeEvent } from "@/lib/hyperliquid/types";

const LIVE_REFRESH_MS = 3000;

type MarketsResponse = {
  source: string;
  markets: Market[];
  snapshots: MarketSnapshot[];
  error?: string;
};

type MarketsTableLiveProps = {
  markets: Market[];
  snapshots: MarketSnapshot[];
  events: TapeEvent[];
};

export function MarketsTableLive({ markets, snapshots, events }: MarketsTableLiveProps) {
  const lastGoodRef = useRef<{ markets: Market[]; snapshots: MarketSnapshot[] }>({ markets, snapshots });
  const marketsPayload = useLiveData<MarketsResponse>(
    "/api/markets",
    { source: "live", markets, snapshots },
    LIVE_REFRESH_MS
  );
  const tapePayload = useLiveData<{ source: string; events: TapeEvent[]; error?: string }>(
    "/api/tape",
    { source: "live", events },
    LIVE_REFRESH_MS
  );

  // Ignore error envelopes that arrive with no markets; keep the last good table.
  if (!(marketsPayload.error && marketsPayload.markets.length === 0)) {
    lastGoodRef.current = { markets: marketsPayload.markets, snapshots: marketsPayload.snapshots };
  }

  const eventsForTable =
    tapePayload.error && tapePayload.events.length === 0 ? events : tapePayload.events;

  return (
    <MarketsTable
      markets={lastGoodRef.current.markets}
      snapshots={lastGoodRef.current.snapshots}
      events={eventsForTable}
    />
  );
}
