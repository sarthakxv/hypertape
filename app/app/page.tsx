import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MarketsTableLive } from "@/components/markets/markets-table-live";
import { WatchlistSidebar } from "@/components/markets/watchlist-sidebar";
import { SWRProvider } from "@/components/providers/swr-provider";
import { LiveTapeLive } from "@/components/tape/live-tape-live";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";
import { LIVE_KEY } from "@/lib/swr/types";
import { formatPoints, formatProbability } from "@/lib/markets/probability";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function SourcePill({ source }: { source: string }) {
  const isLive = source === "live";
  return (
    <>
      {isLive && (
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-positive opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-chart-positive" />
        </span>
      )}
      {isLive ? "live Hyperliquid" : "fixture tape"}
    </>
  );
}

function LiveDataUnavailable() {
  return (
    <AppShell>
      <Card className="px-6 py-8" aria-labelledby="unavailable-heading">
        <h1 id="unavailable-heading" className="m-0 text-[28px] font-bold leading-[1.15]">
          Live data unavailable
        </h1>
        <span className="mt-2 block text-sm text-muted-foreground">
          We could not reach Hyperliquid right now. Try again shortly.
        </span>
      </Card>
    </AppShell>
  );
}

export default async function AppPage() {
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
      <section className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-end sm:gap-4" aria-labelledby="command-heading">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-chart-info">
            Movers Command Center
          </p>
          <h1 id="command-heading" className="m-0 text-[26px] font-medium leading-[1.15] sm:text-[28px]">
            Probability, spread, and depth moves
          </h1>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-[#0c1118] px-2.5 py-1.5 text-xs text-[#b9c4d5] sm:ml-auto">
          <SourcePill source={provider.source} />
        </span>
      </section>

      {movers.length > 0 && <section
        className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3"
        aria-label="Largest market moves"
      >
        {movers.map((event) => {
          const market = marketsById.get(event.marketId);

          return (
            <Link
              className="min-w-0 rounded-md border border-border bg-[#0d1219] p-3 transition-[colors,transform] hover:border-primary/40 hover:-translate-y-0.5"
              href={`/markets/${event.marketId}`}
              key={event.id}
            >
              <span className="block overflow-hidden text-[13px] font-bold text-foreground/80 text-ellipsis whitespace-nowrap">
                {market?.name ?? event.title}
              </span>
              <strong
                className={cn(
                  "mt-2 block text-[22px] font-bold",
                  event.delta != null && event.delta < 0 ? "text-chart-negative" : "text-chart-positive"
                )}
              >
                {event.delta == null ? formatProbability(event.currentProbability ?? null) : formatPoints(event.delta * 100)}
              </strong>
              <small className="mt-1 line-clamp-2 block min-h-8 text-xs leading-[1.35] text-muted-foreground">
                {event.summary}
              </small>
            </Link>
          );
        })}
      </section>}

      <SWRProvider fallback={{ [LIVE_KEY]: { source: provider.source, markets, snapshots, events } }}>
        <div className="grid items-start gap-3.5 grid-cols-1 xl:grid-cols-[1fr_320px]">
          <MarketsTableLive markets={markets} snapshots={snapshots} events={events} />
          <div className="flex flex-col gap-3">
            <LiveTapeLive events={events} />
            <WatchlistSidebar markets={markets} snapshots={snapshots} />
          </div>
        </div>
      </SWRProvider>
    </AppShell>
  );
}
