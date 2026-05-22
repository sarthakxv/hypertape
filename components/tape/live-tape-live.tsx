"use client";

import { useRef } from "react";
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
  const lastGoodRef = useRef<TapeEvent[]>(events);
  const payload = useLiveData<TapeResponse>("/api/tape", { source: "live", events }, LIVE_REFRESH_MS);

  // Ignore error envelopes that arrive with no events; keep the last good feed.
  if (!(payload.error && payload.events.length === 0)) {
    lastGoodRef.current = payload.events;
  }

  return <LiveTape events={lastGoodRef.current} />;
}
