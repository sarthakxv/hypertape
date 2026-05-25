import { AppShell } from "@/components/layout/app-shell";
import { MarketsGridLive } from "@/components/markets/markets-grid-live";
import { SWRProvider } from "@/components/providers/swr-provider";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";
import { LIVE_KEY } from "@/lib/swr/types";
import { Card } from "@/components/ui/card";

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
      <div className="mb-4 flex justify-end">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[#0c1118] px-2.5 py-1.5 text-xs text-[#b9c4d5]">
          <SourcePill source={provider.source} />
        </span>
      </div>

      <SWRProvider fallback={{ [LIVE_KEY]: { source: provider.source, markets, snapshots, events } }}>
        <MarketsGridLive markets={markets} snapshots={snapshots} events={events} />
      </SWRProvider>
    </AppShell>
  );
}
