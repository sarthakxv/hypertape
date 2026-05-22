"use client";

import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
import type { TapeEvent } from "@/lib/hyperliquid/types";
import { formatPoints, formatProbability } from "@/lib/markets/probability";

type LiveTapeProps = {
  events: TapeEvent[];
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
    <section className="panel live-tape" aria-labelledby="live-tape-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Live Tape</p>
          <h2 id="live-tape-heading">Market moves</h2>
        </div>
        <span className="feed-status">Live book</span>
      </div>

      <div className="tape-list">
        {orderedEvents.map((event) => {
          const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(eventText(event))}`;

          return (
            <article className="tape-event" key={event.id}>
              <div className="event-main">
                <div className="event-title-row">
                  <h3>{event.title}</h3>
                  <span className={`severity severity-${event.severity}`}>{event.severity}</span>
                </div>
                <p>{event.summary}</p>
              </div>

              <dl className="event-metrics">
                <div>
                  <dt>Spread</dt>
                  <dd>{event.spread == null ? "-" : formatPoints(event.spread * 100)}</dd>
                </div>
                <div>
                  <dt>Depth</dt>
                  <dd>{event.depth == null ? "-" : `$${event.depth.toLocaleString("en-US")}`}</dd>
                </div>
                <div>
                  <dt>Move</dt>
                  <dd>{event.delta == null ? "-" : formatPoints(event.delta * 100)}</dd>
                </div>
                <div>
                  <dt>UTC</dt>
                  <dd>{formatTimestamp(event.timestamp)}</dd>
                </div>
              </dl>

              <div className="event-actions">
                <button type="button" className="icon-button" onClick={() => void copyEvent(event)} aria-label={`Copy ${event.title}`}>
                  <Copy size={15} aria-hidden="true" />
                </button>
                <a className="icon-button" href={shareUrl} target="_blank" rel="noreferrer" aria-label={`Share ${event.title} on X`}>
                  <ExternalLink size={15} aria-hidden="true" />
                </a>
                <Link className="text-link" href={`/markets/${event.marketId}`}>
                  Market
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
