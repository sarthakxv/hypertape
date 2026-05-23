"use client";

import useSWR from "swr";
import { MarketsGrid } from "@/components/markets/markets-grid";
import { LIVE_KEY, type LiveResponse } from "@/lib/swr/types";
import type { MarketCard, MarketSnapshot, TapeEvent } from "@/lib/hyperliquid/types";

type MarketsGridLiveProps = {
  markets: MarketCard[];
  snapshots: MarketSnapshot[];
  events: TapeEvent[];
};

export function MarketsGridLive({ markets, snapshots, events }: MarketsGridLiveProps) {
  const { data } = useSWR<LiveResponse>(LIVE_KEY);
  const live = data ?? { source: "live", markets, snapshots, events };

  return <MarketsGrid markets={live.markets} snapshots={live.snapshots} events={live.events} />;
}
