"use client";

import useSWR from "swr";
import { LiveTape } from "@/components/tape/live-tape";
import { LIVE_KEY, type LiveResponse } from "@/lib/swr/types";
import type { TapeEvent } from "@/lib/hyperliquid/types";

type LiveTapeLiveProps = {
  events: TapeEvent[];
};

export function LiveTapeLive({ events }: LiveTapeLiveProps) {
  // Shares the `/api/live` key with MarketsTableLive — SWR dedupes the two into
  // a single poll. Seeded from SWRProvider fallback; falls back to props.
  const { data } = useSWR<LiveResponse>(LIVE_KEY);

  return <LiveTape events={data?.events ?? events} />;
}
