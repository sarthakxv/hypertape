import Link from "next/link";
import type { Market, MarketSnapshot, TapeEvent } from "@/lib/hyperliquid/types";
import { formatPoints, formatProbability } from "@/lib/markets/probability";
import { WatchlistStar } from "@/components/markets/watchlist-star";

type MarketsTableProps = {
  markets: Market[];
  snapshots: MarketSnapshot[];
  events: TapeEvent[];
};

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
    <section className="panel markets-panel" aria-labelledby="markets-table-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Active Markets</p>
          <h2 id="markets-table-heading">Book monitor</h2>
        </div>
        <span className="feed-status">{orderedMarkets.length} markets</span>
      </div>

      <div className="table-scroll">
        <table className="markets-table">
          <thead>
            <tr>
              <th scope="col">Market</th>
              <th scope="col">Primary probability</th>
              <th scope="col">5m</th>
              <th scope="col">15m</th>
              <th scope="col">Spread</th>
              <th scope="col">Depth</th>
              <th scope="col">Expiry</th>
              <th scope="col">Status</th>
              <th scope="col">Watchlist</th>
            </tr>
          </thead>
          <tbody>
            {orderedMarkets.map((market) => {
              const snapshot = latestSnapshots.get(market.id);
              const fiveMinuteDelta = eventDelta(events, market.id, 300);
              const fifteenMinuteDelta = eventDelta(events, market.id, 900);

              return (
                <tr key={market.id}>
                  <th scope="row">
                    <Link className="market-link" href={`/markets/${market.id}`}>
                      <span>{market.name}</span>
                      <small>{market.sides[market.primarySide].label} / {market.sides[market.dualSide].label}</small>
                    </Link>
                  </th>
                  <td className="metric-strong">{formatProbability(snapshot?.primaryMid ?? null)}</td>
                  <td className={fiveMinuteDelta != null && fiveMinuteDelta < 0 ? "metric-down" : "metric-up"}>
                    {formatPoints(fiveMinuteDelta)}
                  </td>
                  <td className={fifteenMinuteDelta != null && fifteenMinuteDelta < 0 ? "metric-down" : "metric-up"}>
                    {formatPoints(fifteenMinuteDelta)}
                  </td>
                  <td>{snapshot?.canonicalSpread == null ? "-" : formatPoints(snapshot.canonicalSpread * 100)}</td>
                  <td>{compactCurrency(snapshot?.totalDepthThreePoints)}</td>
                  <td>{formatExpiry(market.expiryTime)}</td>
                  <td>
                    <span className={`status-pill status-${market.status}`}>{market.status}</span>
                  </td>
                  <td>
                    <WatchlistStar marketId={market.id} marketName={market.name} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
