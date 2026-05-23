import { AppShell } from "@/components/layout/app-shell";
import { MarketsTableLive } from "@/components/markets/markets-table-live";
import { SWRProvider } from "@/components/providers/swr-provider";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";
import { LIVE_KEY } from "@/lib/swr/types";
import { Card } from "@/components/ui/card";

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
        <Card className="px-6 py-8" aria-labelledby="markets-unavailable-heading">
          <h1 id="markets-unavailable-heading" className="m-0 text-[28px] font-bold leading-[1.15]">
            Live data unavailable
          </h1>
          <span className="mt-2 block text-sm text-muted-foreground">
            We could not reach Hyperliquid right now. Try again shortly.
          </span>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mb-4 flex items-end gap-4" aria-labelledby="markets-heading">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-chart-info">
            Markets
          </p>
          <h1 id="markets-heading" className="m-0 text-[28px] font-bold leading-[1.15]">
            HIP-4 book monitor
          </h1>
        </div>
        <span className="ml-auto rounded-full border border-border bg-[#0c1118] px-2.5 py-1.5 text-xs text-[#b9c4d5]">
          {sourceLabel(provider.source)}
        </span>
      </section>

      <SWRProvider fallback={{ [LIVE_KEY]: { source: provider.source, markets, snapshots, events } }}>
        <MarketsTableLive markets={markets} snapshots={snapshots} events={events} />
      </SWRProvider>
    </AppShell>
  );
}
