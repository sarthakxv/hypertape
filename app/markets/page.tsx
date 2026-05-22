import { AppShell } from "@/components/layout/app-shell";
import { MarketsTableLive } from "@/components/markets/markets-table-live";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

export const dynamic = "force-dynamic";

function sourceLabel(source: string): string {
  if (source === "live") return "Source: live Hyperliquid";
  return "Source: fixture tape";
}

export default async function MarketsPage() {
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
    return (
      <AppShell>
        <section className="panel empty-state" aria-labelledby="markets-unavailable-heading">
          <h1 id="markets-unavailable-heading">Live data unavailable</h1>
          <span>We could not reach Hyperliquid right now. Try again shortly.</span>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="command-header" aria-labelledby="markets-heading">
        <div>
          <p className="eyebrow">Markets</p>
          <h1 id="markets-heading">HIP-4 book monitor</h1>
        </div>
        <span className="source-marker">{sourceLabel(provider.source)}</span>
      </section>

      <MarketsTableLive markets={markets} snapshots={snapshots} events={events} />
    </AppShell>
  );
}
