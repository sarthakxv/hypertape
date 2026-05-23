"use client";

import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
import type { TapeEvent } from "@/lib/hyperliquid/types";
import { formatPoints, formatProbability } from "@/lib/markets/probability";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LiveTapeProps = {
  events: TapeEvent[];
};

const severityClass: Record<string, string> = {
  low: "border-chart-info/25 bg-chart-info/10 text-chart-info",
  medium: "border-chart-warning/25 bg-chart-warning/10 text-chart-warning",
  high: "border-chart-negative/25 bg-chart-negative/10 text-chart-negative",
};

function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC"
  }).format(new Date(timestamp));
}

function eventText(event: TapeEvent): string {
  const probability = event.currentProbability == null ? "" : ` Current probability ${formatProbability(event.currentProbability)}.`;
  const move = event.delta == null ? "" : ` Move ${formatPoints(event.delta * 100)}.`;
  return `${event.title}. ${event.summary}${probability}${move}`;
}

export function LiveTape({ events }: LiveTapeProps) {
  const orderedEvents = [...events].sort((left, right) => right.timestamp - left.timestamp);

  async function copyEvent(event: TapeEvent) {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(eventText(event));
    } catch {
      // Clipboard access can be denied on insecure or restricted contexts.
    }
  }

  return (
    <Card className="live-tape min-w-0" aria-labelledby="live-tape-heading">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border pb-3">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-chart-info">
            Live Tape
          </p>
          <h2 id="live-tape-heading" className="m-0 text-[17px] font-semibold leading-[1.2]">
            Market moves
          </h2>
        </div>
        <Badge variant="outline" className="rounded-full border-border bg-[#0c1118] text-[#b9c4d5]">
          Live book
        </Badge>
      </CardHeader>
      <CardContent className="max-h-[calc(100vh-200px)] overflow-y-auto p-0">
        <div className="divide-y divide-border">
          {orderedEvents.map((event) => {
            const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(eventText(event))}`;

            return (
              <article className="px-4 py-3" key={event.id}>
                <div className="mb-2">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="m-0 text-sm font-semibold leading-[1.35] text-foreground">
                      {event.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn("shrink-0 text-[8px] font-black uppercase tracking-[0.07em]", severityClass[event.severity])}
                    >
                      {event.severity}
                    </Badge>
                  </div>
                  <p className="m-0 text-xs text-muted-foreground">{event.summary}</p>
                </div>

                <dl className="mb-2 grid grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Spread</dt>
                    <dd className="m-0 font-medium text-foreground">{event.spread == null ? "-" : formatPoints(event.spread * 100)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Depth</dt>
                    <dd className="m-0 font-medium text-foreground">{event.depth == null ? "-" : `$${event.depth.toLocaleString("en-US")}`}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Move</dt>
                    <dd className="m-0 font-medium text-foreground">{event.delta == null ? "-" : formatPoints(event.delta * 100)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">UTC</dt>
                    <dd className="m-0 font-medium text-foreground">{formatTimestamp(event.timestamp)}</dd>
                  </div>
                </dl>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => void copyEvent(event)}
                    aria-label={`Copy ${event.title}`}
                  >
                    <Copy size={15} aria-hidden="true" />
                  </Button>
                  <a
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/20 hover:text-foreground"
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Share ${event.title} on X`}
                  >
                    <ExternalLink size={15} aria-hidden="true" />
                  </a>
                  <Link
                    className="rounded px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                    href={`/markets/${event.marketId}`}
                  >
                    Market
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
