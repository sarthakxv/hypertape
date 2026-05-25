import Link from "next/link";
import type { MarketCard, MarketSnapshot, TapeEvent } from "@/lib/hyperliquid/types";
import { formatPoints, formatProbability } from "@/lib/markets/probability";
import { WatchlistStar } from "@/components/markets/watchlist-star";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type MarketsTableProps = {
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
  if (probability == null) return "-";
  return `${Math.round(probability * 100)}%`;
}

function compactCurrency(value: number | null | undefined): string {
  if (value == null) return "-";
  return `$${Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value)}`;
}

function formatExpiry(value: string | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC"
  }).format(new Date(value));
}

function latestSnapshotsByMarket(snapshots: MarketSnapshot[]): Map<string, MarketSnapshot> {
  return snapshots.reduce((latestByMarket, snapshot) => {
    const current = latestByMarket.get(snapshot.marketId);
    if (!current || snapshot.timestamp > current.timestamp) {
      latestByMarket.set(snapshot.marketId, snapshot);
    }
    return latestByMarket;
  }, new Map<string, MarketSnapshot>());
}

function latestEventsByMarket(events: TapeEvent[]): Map<string, TapeEvent> {
  return events.reduce((latestByMarket, event) => {
    const current = latestByMarket.get(event.marketId);
    if (!current || event.timestamp > current.timestamp) {
      latestByMarket.set(event.marketId, event);
    }
    return latestByMarket;
  }, new Map<string, TapeEvent>());
}

function eventDelta(events: TapeEvent[], marketId: string, windowSeconds: number): number | null {
  const event = events
    .filter((candidate) => candidate.marketId === marketId && candidate.windowSeconds === windowSeconds)
    .sort((left, right) => right.timestamp - left.timestamp)[0];

  return event?.delta == null ? null : event.delta * 100;
}

export function MarketsTable({ markets, snapshots, events }: MarketsTableProps) {
  const latestSnapshots = latestSnapshotsByMarket(snapshots);
  const latestEvents = latestEventsByMarket(events);
  const orderedMarkets = [...markets].sort((left, right) => {
    const leftDelta = Math.abs(latestEvents.get(left.id)?.delta ?? 0);
    const rightDelta = Math.abs(latestEvents.get(right.id)?.delta ?? 0);
    if (rightDelta !== leftDelta) return rightDelta - leftDelta;
    return left.name.localeCompare(right.name);
  });

  return (
    <Card className="markets-panel min-w-0" aria-labelledby="markets-table-heading">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border pb-3">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-chart-info">
            Active Markets
          </p>
          <h2 id="markets-table-heading" className="m-0 text-[17px] font-semibold leading-[1.2]">
            Book monitor
          </h2>
        </div>
        <Badge variant="outline" className="rounded-full border-border bg-[#0c1118] text-[#b9c4d5]">
          {orderedMarkets.length} markets
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="table-scroll">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="min-w-[200px] text-muted-foreground">Market</TableHead>
                <TableHead className="min-w-[130px] text-muted-foreground">Primary probability</TableHead>
                <TableHead className="min-w-[60px] text-muted-foreground">5m</TableHead>
                <TableHead className="min-w-[60px] text-muted-foreground">15m</TableHead>
                <TableHead className="min-w-[80px] text-muted-foreground">Spread</TableHead>
                <TableHead className="min-w-[80px] text-muted-foreground">Depth</TableHead>
                <TableHead className="min-w-[120px] text-muted-foreground">Expiry</TableHead>
                <TableHead className="min-w-[75px] text-muted-foreground">Status</TableHead>
                <TableHead className="min-w-[55px] text-muted-foreground">Watchlist</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedMarkets.map((market) => {
                if (market.kind === "bucket") {
                  return (
                    <TableRow key={market.id} className="border-border hover:bg-accent/5">
                      <TableHead scope="row" className="h-auto py-3.5 font-normal">
                        <Link
                          className="block text-[13px] font-semibold text-foreground hover:text-primary"
                          href={`/markets/${market.id}`}
                        >
                          <span className="block">{market.name}</span>
                          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-normal text-muted-foreground">
                            {market.legs.map((leg) => (
                              <li key={leg.outcomeId}>
                                {leg.label} <strong className="text-foreground">{formatLegPercent(leg.probability)}</strong>
                              </li>
                            ))}
                          </ul>
                        </Link>
                      </TableHead>
                      <TableCell className="font-bold text-foreground">Multi</TableCell>
                      <TableCell className="text-chart-positive">-</TableCell>
                      <TableCell className="text-chart-positive">-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{formatExpiry(market.expiryTime)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-[0.07em]", statusClass[market.status])}>
                          {market.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <WatchlistStar marketId={market.id} marketName={market.name} />
                      </TableCell>
                    </TableRow>
                  );
                }

                const snapshot = latestSnapshots.get(market.id);
                const fiveMinuteDelta = eventDelta(events, market.id, 300);
                const fifteenMinuteDelta = eventDelta(events, market.id, 900);

                return (
                  <TableRow key={market.id} className="border-border hover:bg-accent/5">
                    <TableHead scope="row" className="font-normal">
                      <Link
                        className="block text-[13px] font-semibold text-foreground hover:text-primary"
                        href={`/markets/${market.id}`}
                      >
                        <span className="block">{market.name}</span>
                        <small className="font-normal text-muted-foreground">
                          {market.sides[market.primarySide].label} / {market.sides[market.dualSide].label}
                        </small>
                      </Link>
                    </TableHead>
                    <TableCell className="font-bold text-foreground">
                      {formatProbability(snapshot?.primaryMid ?? null)}
                    </TableCell>
                    <TableCell className={fiveMinuteDelta != null && fiveMinuteDelta < 0 ? "text-chart-negative" : "text-chart-positive"}>
                      {formatPoints(fiveMinuteDelta)}
                    </TableCell>
                    <TableCell className={fifteenMinuteDelta != null && fifteenMinuteDelta < 0 ? "text-chart-negative" : "text-chart-positive"}>
                      {formatPoints(fifteenMinuteDelta)}
                    </TableCell>
                    <TableCell>{snapshot?.canonicalSpread == null ? "-" : formatPoints(snapshot.canonicalSpread * 100)}</TableCell>
                    <TableCell>{compactCurrency(snapshot?.totalDepthThreePoints)}</TableCell>
                    <TableCell>{formatExpiry(market.expiryTime)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-[0.07em]", statusClass[market.status])}>
                        {market.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <WatchlistStar marketId={market.id} marketName={market.name} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
