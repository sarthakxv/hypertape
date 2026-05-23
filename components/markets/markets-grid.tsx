import Image from "next/image";
import Link from "next/link";
import type { MarketCard, MarketSnapshot, TapeEvent } from "@/lib/hyperliquid/types";
import { formatPoints, formatProbability } from "@/lib/markets/probability";
import { WatchlistStar } from "@/components/markets/watchlist-star";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type MarketsGridProps = {
  markets: MarketCard[];
  snapshots: MarketSnapshot[];
  events: TapeEvent[];
};

const statusClass: Record<string, string> = {
  active: "border-chart-positive/25 bg-chart-positive/10 text-chart-positive",
  settling: "border-chart-warning/25 bg-chart-warning/10 text-chart-warning",
  settled: "border-border bg-muted text-muted-foreground",
};

function formatLegPercent(probability: number | null): string {
  if (probability == null) return "—";
  return `${Math.round(probability * 100)}%`;
}

function compactCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return `$${Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
}

function formatExpiry(value: string | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")} ${get("day")} ${get("month")} @ ${get("hour")}:${get("minute")} ${get("dayPeriod").toLowerCase()}`;
}

function latestSnapshotsByMarket(snapshots: MarketSnapshot[]): Map<string, MarketSnapshot> {
  return snapshots.reduce((acc, s) => {
    const cur = acc.get(s.marketId);
    if (!cur || s.timestamp > cur.timestamp) acc.set(s.marketId, s);
    return acc;
  }, new Map<string, MarketSnapshot>());
}

function latestEventsByMarket(events: TapeEvent[]): Map<string, TapeEvent> {
  return events.reduce((acc, e) => {
    const cur = acc.get(e.marketId);
    if (!cur || e.timestamp > cur.timestamp) acc.set(e.marketId, e);
    return acc;
  }, new Map<string, TapeEvent>());
}

function eventDelta(events: TapeEvent[], marketId: string, windowSeconds: number): number | null {
  const event = events
    .filter((e) => e.marketId === marketId && e.windowSeconds === windowSeconds)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  return event?.delta == null ? null : event.delta * 100;
}

function StatusBadge({ status }: { status: string }) {
  const isLive = status === "active";
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.07em]",
        statusClass[status] ?? "border-border bg-muted text-muted-foreground"
      )}
    >
      {isLive && (
        <span className="relative flex size-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-positive opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-chart-positive" />
        </span>
      )}
      {isLive ? "Live" : status}
    </Badge>
  );
}

function DeltaStat({ label, value }: { label: string; value: number | null }) {
  const isNeg = value != null && value < 0;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-[13px] font-semibold tabular-nums",
          isNeg ? "text-chart-negative" : "text-chart-positive"
        )}
      >
        {formatPoints(value)}
      </span>
    </div>
  );
}

function LegBar({ label, probability }: { label: string; probability: number | null }) {
  const pct = probability != null ? Math.round(probability * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-22 shrink-0 truncate text-[12px] text-muted-foreground">{label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/70"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-[13px] font-bold tabular-nums text-foreground">
        {formatLegPercent(probability)}
      </span>
    </div>
  );
}

function isBtc(underlying: string | undefined): boolean {
  if (!underlying) return false;
  const u = underlying.toLowerCase();
  return u === "btc" || u === "bitcoin";
}

const cardBase =
  "flex flex-1 flex-col gap-3.5 rounded-xl p-4 bg-card ring-1 ring-foreground/10 transition-all duration-200 hover:ring-primary/35 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.2),0_4px_20px_hsl(var(--primary)/0.06)]";

function BinaryMarketCard({
  market,
  snapshot,
  events,
}: {
  market: Extract<MarketCard, { kind: "binary" }>;
  snapshot: MarketSnapshot | undefined;
  events: TapeEvent[];
}) {
  const fiveMin = eventDelta(events, market.id, 300);
  const fifteenMin = eventDelta(events, market.id, 900);

  return (
    <article className="relative flex flex-col">
      <Link href={`/markets/${market.id}`} className={cardBase}>
        {/* Header */}
        <div className="flex min-h-0 gap-2.5 pr-8">
          {isBtc(market.underlying) && (
            <Image
              src="/icons/bitcoin.png"
              alt="BTC"
              width={28}
              height={28}
              className="mt-0.5 shrink-0 rounded-full min-w-fit"
            />
          )}
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <StatusBadge status={market.status} />
              {market.underlying && (
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {market.underlying}
                </span>
              )}
            </div>
            <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-foreground">
              {market.name}
            </h3>
          </div>
        </div>

        {/* Primary probability — hero number */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-[2.5rem] font-bold leading-none tabular-nums text-foreground">
            {formatProbability(snapshot?.primaryMid ?? null)}
          </span>
          <span className="text-[11px] text-muted-foreground">primary</span>
        </div>

        {/* Momentum deltas */}
        <div className="flex gap-5">
          <DeltaStat label="5m" value={fiveMin} />
          <DeltaStat label="15m" value={fifteenMin} />
        </div>

        {/* Footer stats */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <span className="text-[11px] text-muted-foreground">
            {compactCurrency(snapshot?.recentVolume)}{" "}
            <span className="opacity-50">vol</span>
          </span>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {formatExpiry(market.expiryTime)}
          </span>
        </div>
      </Link>

      <div className="absolute right-3 top-3 z-10">
        <WatchlistStar marketId={market.id} marketName={market.name} />
      </div>
    </article>
  );
}

function BucketMarketCard({
  market,
  snapshot,
}: {
  market: Extract<MarketCard, { kind: "bucket" }>;
  snapshot: MarketSnapshot | undefined;
}) {
  const sortedLegs = [...market.legs].sort((a, b) => {
    if (a.probability == null && b.probability == null) return 0;
    if (a.probability == null) return 1;
    if (b.probability == null) return -1;
    return b.probability - a.probability;
  });

  return (
    <article className="relative flex flex-col">
      <Link href={`/markets/${market.id}`} className={cardBase}>
        {/* Header */}
        <div className="flex min-h-0 gap-2.5 pr-8">
          {isBtc(market.underlying) && (
            <Image
              src="/icons/bitcoin.png"
              alt="BTC"
              width={28}
              height={28}
              className="mt-0.5 shrink-0 rounded-full min-w-fit"
            />
          )}
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <StatusBadge status={market.status} />
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Multi-outcome
              </span>
            </div>
            <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-foreground">
              {market.name}
            </h3>
          </div>
        </div>

        {/* Leg probability bars — sorted highest to lowest */}
        <div className="flex flex-col gap-2.5">
          {sortedLegs.map((leg) => (
            <LegBar key={leg.outcomeId} label={leg.label} probability={leg.probability} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <span className="text-[11px] text-muted-foreground">
            {compactCurrency(snapshot?.recentVolume)}{" "}
            <span className="opacity-50">vol</span>
          </span>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {formatExpiry(market.expiryTime)}
          </span>
        </div>
      </Link>

      <div className="absolute right-3 top-3 z-10">
        <WatchlistStar marketId={market.id} marketName={market.name} />
      </div>
    </article>
  );
}

export function MarketsGrid({ markets, snapshots, events }: MarketsGridProps) {
  const latestSnapshots = latestSnapshotsByMarket(snapshots);
  const latestEvents = latestEventsByMarket(events);

  const orderedMarkets = [...markets].sort((a, b) => {
    const aDelta = Math.abs(latestEvents.get(a.id)?.delta ?? 0);
    const bDelta = Math.abs(latestEvents.get(b.id)?.delta ?? 0);
    if (bDelta !== aDelta) return bDelta - aDelta;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {orderedMarkets.map((market) => {
        if (market.kind === "bucket") {
          return <BucketMarketCard key={market.id} market={market} snapshot={latestSnapshots.get(market.id)} />;
        }
        return (
          <BinaryMarketCard
            key={market.id}
            market={market}
            snapshot={latestSnapshots.get(market.id)}
            events={events}
          />
        );
      })}
    </div>
  );
}
