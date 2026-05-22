import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MarketsTable } from "@/components/markets/markets-table";
import { WatchlistSidebar } from "@/components/markets/watchlist-sidebar";
import { LiveTape } from "@/components/tape/live-tape";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";
import { formatPoints, formatProbability } from "@/lib/markets/probability";

export const dynamic = "force-dynamic";

function sourceLabel(source: string): string {
  if (source === "live") return "Source: live Hyperliquid";
  return "Source: fixture tape";
}

function LiveDataUnavailable() {
  return (
    <AppShell>
      <section className="panel empty-state" aria-labelledby="unavailable-heading">
        <h1 id="unavailable-heading">Live data unavailable</h1>
        <span>We could not reach Hyperliquid right now. Try again shortly.</span>
      </section>
    </AppShell>
  );
}

export default async function HomePage() {
  const provider = getMarketDataProvider(process.env);

  let markets;
  let snapshots;
  let events;
  try {
    [markets, snapshots, events] = await Promise.all([
      provider.getMarkets(),
      provider.getSnapshots(),
      provider.getTapeEvents()
    ]);
  } catch {
    return <LiveDataUnavailable />;
  }

  const marketsById = new Map(markets.map((market) => [market.id, market]));
  const movers = [...events]
    .sort((left, right) => Math.abs(right.delta ?? 0) - Math.abs(left.delta ?? 0))
    .slice(0, 3);

  return (
    <AppShell>
      <section className="command-header" aria-labelledby="command-heading">
        <div>
          <p className="eyebrow">Movers Command Center</p>
          <h1 id="command-heading">Probability, spread, and depth moves</h1>
        </div>
        <span className="source-marker">{sourceLabel(provider.source)}</span>
      </section>

      <section className="movers-strip" aria-label="Largest market moves">
        {movers.map((event) => {
          const market = marketsById.get(event.marketId);

          return (
            <Link className="mover-tile" href={`/markets/${event.marketId}`} key={event.id}>
              <span>{market?.name ?? event.title}</span>
              <strong>{event.delta == null ? formatProbability(event.currentProbability ?? null) : formatPoints(event.delta * 100)}</strong>
              <small>{event.summary}</small>
            </Link>
          );
        })}
      </section>

      <div className="command-grid">
        <LiveTape events={events} />
        <MarketsTable markets={markets} snapshots={snapshots} events={events} />
        <WatchlistSidebar markets={markets} snapshots={snapshots} />
      </div>
    </AppShell>
  );
}
