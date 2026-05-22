"use client";

import { useRef } from "react";
import { MarketDetail } from "@/components/markets/market-detail";
import { useLiveData } from "@/lib/hooks/use-live-data";
import type { Market, MarketSnapshot, TapeEvent } from "@/lib/hyperliquid/types";

const LIVE_REFRESH_MS = 3000;

type MarketDetailResponse = {
  source: string;
  market: Market | null;
  snapshots: MarketSnapshot[];
  events: TapeEvent[];
  error?: string;
};

type MarketDetailLiveProps = {
  market: Market;
  snapshots: MarketSnapshot[];
  events: TapeEvent[];
  sourceLabel: string;
};

export function MarketDetailLive({ market, snapshots, events, sourceLabel }: MarketDetailLiveProps) {
  const lastGoodRef = useRef<{ snapshots: MarketSnapshot[]; events: TapeEvent[] }>({ snapshots, events });
  const payload = useLiveData<MarketDetailResponse>(
    `/api/markets/${market.id}`,
    { source: "live", market, snapshots, events },
    LIVE_REFRESH_MS
  );

  // Ignore error envelopes that arrive without a market; keep the last good detail.
  if (payload.market && !(payload.error && payload.snapshots.length === 0)) {
    lastGoodRef.current = { snapshots: payload.snapshots, events: payload.events };
  }

  return (
    <MarketDetail
      market={payload.market ?? market}
      snapshots={lastGoodRef.current.snapshots}
      events={lastGoodRef.current.events}
      sourceLabel={sourceLabel}
    />
  );
}
