"use client";

import useSWR from "swr";
import { MarketDetail } from "@/components/markets/market-detail";
import { marketDetailKey, type MarketDetailResponse } from "@/lib/swr/types";
import type { MarketCard, MarketSnapshot, TapeEvent } from "@/lib/hyperliquid/types";

type MarketDetailLiveProps = {
  market: MarketCard;
  snapshots: MarketSnapshot[];
  events: TapeEvent[];
  sourceLabel: React.ReactNode;
};

export function MarketDetailLive({ market, snapshots, events, sourceLabel }: MarketDetailLiveProps) {
  // Seeded from SWRProvider fallback; on a failed refresh the fetcher throws and
  // SWR keeps the last good `data` rather than blanking the market.
  const { data } = useSWR<MarketDetailResponse>(marketDetailKey(market.id));
  const live = data ?? { source: "live", market, snapshots, events };

  return (
    <MarketDetail
      market={live.market ?? market}
      snapshots={live.snapshots}
      events={live.events}
      sourceLabel={sourceLabel}
    />
  );
}
