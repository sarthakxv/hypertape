"use client";

import useSWR from "swr";
import { MarketsTable } from "@/components/markets/markets-table";
import { LIVE_KEY, type LiveResponse } from "@/lib/swr/types";
import type { MarketCard, MarketSnapshot, TapeEvent } from "@/lib/hyperliquid/types";

type MarketsTableLiveProps = {
  markets: MarketCard[];
  snapshots: MarketSnapshot[];
  events: TapeEvent[];
};

export function MarketsTableLive({ markets, snapshots, events }: MarketsTableLiveProps) {
  // Seeded from SWRProvider fallback; `data` is defined on first paint. On a
  // failed refresh the fetcher throws and SWR keeps the last good `data`.
  const { data } = useSWR<LiveResponse>(LIVE_KEY);
  const live = data ?? { source: "live", markets, snapshots, events };

  return <MarketsTable markets={live.markets} snapshots={live.snapshots} events={live.events} />;
}
