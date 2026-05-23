import { Bell, Clock, Database, Info, Layers, Radio, SlidersHorizontal } from "lucide-react";
import { ProbabilityChart } from "@/components/charts/probability-chart";
import { LiveTape } from "@/components/tape/live-tape";
import type {
  BookLevel,
  BucketMarket,
  Market,
  MarketCard,
  MarketSnapshot,
  TapeEvent
} from "@/lib/hyperliquid/types";
import { formatPoints, formatProbability } from "@/lib/markets/probability";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type MarketDetailProps = {
  market: MarketCard;
  snapshots: MarketSnapshot[];
  events: TapeEvent[];
  sourceLabel: string;
};

type BinaryMarketDetailProps = {
  market: Market;
  snapshots: MarketSnapshot[];
  events: TapeEvent[];
  sourceLabel: string;
};

type DepthBand = {
  label: string;
  bidDepth: number | null;
  askDepth: number | null;
  totalDepth: number | null;
};

const statusClass: Record<string, string> = {
  active: "border-chart-positive/25 bg-chart-positive/10 text-chart-positive",
  settling: "border-chart-warning/25 bg-chart-warning/10 text-chart-warning",
  settled: "border-border bg-muted text-muted-foreground",
};

function compactCurrency(value: number | null | undefined): string {
  if (value == null) return "-";
  return `$${Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2
  }).format(value)}`;
}

function fullCurrency(value: number | null | undefined): string {
  if (value == null) return "-";
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatExpiry(value: string | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
    timeZoneName: "short"
  }).format(new Date(value));
}

function formatTimestamp(value: number | null | undefined): string {
  if (value == null) return "-";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
    timeZoneName: "short"
  }).format(new Date(value));
}

function latestSnapshot(snapshots: MarketSnapshot[]): MarketSnapshot | undefined {
  return [...snapshots].sort((left, right) => right.timestamp - left.timestamp)[0];
}

function sideLabel(market: Market, side: 0 | 1): string {
  return market.sides.find((candidate) => candidate.side === side)?.label ?? `Side ${side}`;
}

function orderbookRows(bids: BookLevel[], asks: BookLevel[]) {
  const rowCount = Math.max(bids.length, asks.length);
  return Array.from({ length: rowCount }, (_, index) => ({
    bid: bids[index],
    ask: asks[index]
  }));
}

function rawMetadata(raw: unknown): string {
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return "Raw metadata could not be serialized.";
  }
}

function bucketLegPercent(probability: number | null): string {
  if (probability == null) return "-";
  return `${Math.round(probability * 100)}%`;
}

function bucketLegWidth(probability: number | null): string {
  if (probability == null) return "0%";
  return `${Math.max(0, Math.min(100, Math.round(probability * 100)))}%`;
}

function PanelHeader({
  eyebrow,
  title,
  headingId,
  icon,
}: {
  eyebrow: string;
  title: string;
  headingId: string;
  icon: React.ReactNode;
}) {
  return (
    <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border pb-3">
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-chart-info">
          {eyebrow}
        </p>
        <h2 id={headingId} className="m-0 text-[17px] font-semibold leading-[1.2]">
          {title}
        </h2>
      </div>
      <span className="text-muted-foreground">{icon}</span>
    </CardHeader>
  );
}

function BucketMarketDetail({
  market,
  sourceLabel
}: {
  market: BucketMarket;
  sourceLabel: string;
}) {
  return (
    <>
      <section
        className="mb-4 flex items-start gap-4"
        aria-labelledby="market-heading"
      >
        <div className="flex-1">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-chart-info">
            Market Detail
          </p>
          <h1 id="market-heading" className="m-0 text-[28px] font-bold leading-[1.15]">
            {market.name}
          </h1>
          <div className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Market metadata">
            {[
              `Question ${market.questionId}`,
              `Underlying ${market.underlying ?? "unknown"}`,
              `Period ${market.period ?? "unknown"}`,
              `Expiry ${formatExpiry(market.expiryTime)}`,
            ].map((label) => (
              <span
                key={label}
                className="inline-flex min-h-6 items-center rounded-md border border-border bg-[#0b0f15] px-1.5 py-1 text-xs text-[#b9c4d5]"
              >
                {label}
              </span>
            ))}
            <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-[0.07em]", statusClass[market.status])}>
              {market.status}
            </Badge>
          </div>
        </div>
        <span className="ml-auto rounded-full border border-border bg-[#0c1118] px-2.5 py-1.5 text-xs text-[#b9c4d5]">
          {sourceLabel}
        </span>
      </section>

      <Card aria-labelledby="bucket-outcomes-heading">
        <PanelHeader
          eyebrow="Outcomes"
          title="Bucket probabilities"
          headingId="bucket-outcomes-heading"
          icon={<Layers size={17} aria-hidden="true" />}
        />
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {market.legs.map((leg) => (
              <li key={leg.outcomeId} className="px-4 py-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-foreground">{leg.label}</span>
                  <strong className="text-sm font-bold text-foreground">{bucketLegPercent(leg.probability)}</strong>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/20"
                  aria-hidden="true"
                >
                  <span
                    className="block h-full rounded-full bg-primary transition-all"
                    style={{ width: bucketLegWidth(leg.probability) }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}

export function MarketDetail({ market, snapshots, events, sourceLabel }: MarketDetailProps) {
  if (market.kind === "bucket") {
    return <BucketMarketDetail market={market} sourceLabel={sourceLabel} />;
  }
  return (
    <BinaryMarketDetail market={market} snapshots={snapshots} events={events} sourceLabel={sourceLabel} />
  );
}

function BinaryMarketDetail({ market, snapshots, events, sourceLabel }: BinaryMarketDetailProps) {
  const latest = latestSnapshot(snapshots);
  const primaryLabel = sideLabel(market, market.primarySide);
  const dualLabel = sideLabel(market, market.dualSide);
  const depthBands: DepthBand[] = [
    {
      label: "1 point",
      bidDepth: latest?.bidDepthOnePoint ?? null,
      askDepth: latest?.askDepthOnePoint ?? null,
      totalDepth: latest?.totalDepthOnePoint ?? null
    },
    {
      label: "3 points",
      bidDepth: latest?.bidDepthThreePoints ?? null,
      askDepth: latest?.askDepthThreePoints ?? null,
      totalDepth: latest?.totalDepthThreePoints ?? null
    },
    {
      label: "5 points",
      bidDepth: latest?.bidDepthFivePoints ?? null,
      askDepth: latest?.askDepthFivePoints ?? null,
      totalDepth: latest?.totalDepthFivePoints ?? null
    }
  ];

  return (
    <>
      <section
        className="mb-4 flex items-start gap-4"
        aria-labelledby="market-heading"
      >
        <div className="flex-1">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-chart-info">
            Market Detail
          </p>
          <h1 id="market-heading" className="m-0 text-[28px] font-bold leading-[1.15]">
            {market.name}
          </h1>
          <div className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Market metadata">
            {[
              `Outcome ${market.outcomeId}`,
              `Quote ${market.quoteToken ?? "unknown"}`,
              `Expiry ${formatExpiry(market.expiryTime)}`,
              `${market.statusSource} status`,
            ].map((label) => (
              <span
                key={label}
                className="inline-flex min-h-6 items-center rounded-md border border-border bg-[#0b0f15] px-1.5 py-1 text-xs text-[#b9c4d5]"
              >
                {label}
              </span>
            ))}
            <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-[0.07em]", statusClass[market.status])}>
              {market.status}
            </Badge>
          </div>
        </div>
        <span className="ml-auto rounded-full border border-border bg-[#0c1118] px-2.5 py-1.5 text-xs text-[#b9c4d5]">
          {sourceLabel}
        </span>
      </section>

      {/* Stat tiles */}
      <section
        className="mb-3.5 grid grid-cols-1 gap-2.5 md:grid-cols-4"
        aria-label="Current probabilities and book"
      >
        {[
          {
            label: `${primaryLabel} probability`,
            value: formatProbability(latest?.primaryMid ?? null),
            sub: `Bid ${formatProbability(latest?.primaryBestBid ?? null)} / Ask ${formatProbability(latest?.primaryBestAsk ?? null)}`
          },
          {
            label: `${dualLabel} probability`,
            value: formatProbability(latest?.dualMid ?? null),
            sub: `Bid ${formatProbability(latest?.dualBestBid ?? null)} / Ask ${formatProbability(latest?.dualBestAsk ?? null)}`
          },
          {
            label: "Spread",
            value: latest?.canonicalSpread == null ? "-" : formatPoints(latest.canonicalSpread * 100),
            sub: "Canonical bid/ask across the primary book."
          },
          {
            label: "Liquidity",
            value: compactCurrency(latest?.totalDepthThreePoints),
            sub: "Depth inside 3 probability points."
          },
        ].map((tile) => (
          <article
            key={tile.label}
            className="min-w-0 rounded-md border border-border bg-[#0d1219] p-3"
          >
            <span className="block overflow-hidden text-[13px] font-bold text-foreground/80 text-ellipsis whitespace-nowrap">
              {tile.label}
            </span>
            <strong className="mt-2 block text-[22px] font-bold text-chart-positive">
              {tile.value}
            </strong>
            <small className="mt-1 line-clamp-2 block min-h-8 text-xs leading-[1.35] text-muted-foreground">
              {tile.sub}
            </small>
          </article>
        ))}
      </section>

      {/* Chart + orderbook grid */}
      <div className="mb-3.5 grid items-start gap-3.5 md:grid-cols-[minmax(420px,1.2fr)_minmax(360px,0.8fr)]">
        <Card className="overflow-hidden" aria-labelledby="probability-history-heading">
          <PanelHeader
            eyebrow="Probability"
            title="Primary-side history"
            headingId="probability-history-heading"
            icon={<Radio size={17} aria-hidden="true" />}
          />
          <CardContent className="p-0">
            <ProbabilityChart snapshots={snapshots} />
          </CardContent>
        </Card>

        <Card aria-labelledby="book-heading">
          <PanelHeader
            eyebrow="Book"
            title="Canonical orderbook"
            headingId="book-heading"
            icon={<Database size={17} aria-hidden="true" />}
          />
          <CardContent className="p-0">
            <div className="table-scroll">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Bid size</TableHead>
                    <TableHead className="text-muted-foreground">Bid probability</TableHead>
                    <TableHead className="text-muted-foreground">Ask probability</TableHead>
                    <TableHead className="text-muted-foreground">Ask size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latest && orderbookRows(latest.bids, latest.asks).length > 0 ? (
                    orderbookRows(latest.bids, latest.asks).map((row, index) => (
                      <TableRow
                        key={`${row.bid?.price ?? "empty"}-${row.ask?.price ?? "empty"}-${index}`}
                        className="border-border"
                      >
                        <TableCell>{row.bid?.size.toLocaleString("en-US") ?? "-"}</TableCell>
                        <TableCell className="text-chart-positive">
                          {formatProbability(row.bid?.price ?? null)}
                        </TableCell>
                        <TableCell className="text-chart-negative">
                          {formatProbability(row.ask?.price ?? null)}
                        </TableCell>
                        <TableCell>{row.ask?.size.toLocaleString("en-US") ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-border">
                      <TableCell colSpan={4}>No book levels published.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Depth bands */}
      <section
        className="mb-3.5 grid grid-cols-1 gap-2.5 md:grid-cols-3"
        aria-label="Depth bands"
      >
        {depthBands.map((band) => (
          <article
            key={band.label}
            className="min-w-0 rounded-md border border-border bg-[#0d1219] p-3"
          >
            <div className="flex items-baseline justify-between gap-2.5">
              <span className="text-[11px] font-bold uppercase text-[#7f8b9e]">{band.label}</span>
              <strong className="text-[17px] font-bold text-chart-positive">{fullCurrency(band.totalDepth)}</strong>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <dt className="text-[11px] font-bold uppercase text-[#7f8b9e]">Bid depth</dt>
                <dd className="mt-1 text-xs font-bold text-[#dfe8f6]">{fullCurrency(band.bidDepth)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase text-[#7f8b9e]">Ask depth</dt>
                <dd className="mt-1 text-xs font-bold text-[#dfe8f6]">{fullCurrency(band.askDepth)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      {/* Tape + local alert draft */}
      <div className="mb-3.5 grid items-start gap-3.5 md:grid-cols-[minmax(420px,1fr)_minmax(320px,0.72fr)]">
        <LiveTape events={events} />

        <Card aria-labelledby="market-alert-heading">
          <PanelHeader
            eyebrow="Alerts"
            title="Local draft"
            headingId="market-alert-heading"
            icon={<Bell size={17} aria-hidden="true" />}
          />
          <CardContent className="grid gap-3 p-4">
            <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Scope
              <select
                defaultValue="market"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="market">This market</option>
                <option value="watchlist">Watchlist</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Move threshold
              <Input type="number" min="1" max="50" defaultValue="5" />
            </label>
            <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Window
              <select
                defaultValue="900"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="300">5 minutes</option>
                <option value="900">15 minutes</option>
                <option value="1800">30 minutes</option>
              </select>
            </label>
            <Button type="button" variant="outline" disabled className="cursor-not-allowed opacity-70">
              Telegram delivery disabled
            </Button>
            <p className="m-0 text-xs text-muted-foreground">
              Draft only. No backend delivery is enabled for Telegram.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debug / metadata panel */}
      <Card aria-labelledby="debug-heading">
        <PanelHeader
          eyebrow="Builder"
          title="Outcome metadata"
          headingId="debug-heading"
          icon={<SlidersHorizontal size={17} aria-hidden="true" />}
        />
        <CardContent className="p-0">
          <dl className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
            {[
              { label: "Outcome ID", value: market.outcomeId },
              { label: "Side labels", value: market.sides.map((side) => side.label).join(" / ") },
              { label: "Encodings", value: market.sides.map((side) => side.encoding).join(" / ") },
              { label: "Spot coins", value: market.sides.map((side) => side.coin).join(" / ") },
              { label: "Token names", value: market.sides.map((side) => side.tokenName).join(" / ") },
              { label: "Asset IDs", value: market.sides.map((side) => side.assetId).join(" / ") },
              { label: "Quote token", value: market.quoteToken ?? "unknown" },
              { label: "Last book", value: formatTimestamp(latest?.lastBookUpdateAt) },
            ].map((item) => (
              <div key={item.label} className="bg-card p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{item.label}</dt>
                <dd className="mt-1 text-sm text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
          <details className="group border-t border-border">
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground">
              <Info size={15} aria-hidden="true" />
              Raw metadata
            </summary>
            <pre className="overflow-x-auto px-4 pb-4 text-xs text-muted-foreground">{rawMetadata(market.raw)}</pre>
          </details>
          <div className="flex items-center gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground">
            <Clock size={15} aria-hidden="true" />
            Snapshot {formatTimestamp(latest?.timestamp)}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
