"use client";

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
  // Reject error envelopes that arrive without a market; the hook keeps last good.
  const payload = useLiveData<MarketDetailResponse>(
    `/api/markets/${market.id}`,
    { source: "live", market, snapshots, events },
    LIVE_REFRESH_MS,
    (p) => !(p.error && !p.market)
  );

  return (
    <MarketDetail
      market={payload.market ?? market}
      snapshots={payload.snapshots}
      events={payload.events}
      sourceLabel={sourceLabel}
    />
  );
}
