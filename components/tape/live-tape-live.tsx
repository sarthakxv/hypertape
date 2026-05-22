"use client";

import { LiveTape } from "@/components/tape/live-tape";
import { useLiveData } from "@/lib/hooks/use-live-data";
import type { TapeEvent } from "@/lib/hyperliquid/types";

const LIVE_REFRESH_MS = 3000;

type TapeResponse = {
  source: string;
  events: TapeEvent[];
  error?: string;
};

type LiveTapeLiveProps = {
  events: TapeEvent[];
};

export function LiveTapeLive({ events }: LiveTapeLiveProps) {
  // Reject error envelopes that arrive with no events; the hook keeps last good.
  const payload = useLiveData<TapeResponse>(
    "/api/tape",
    { source: "live", events },
    LIVE_REFRESH_MS,
    (p) => !(p.error && p.events.length === 0)
  );

  return <LiveTape events={payload.events} />;
}
