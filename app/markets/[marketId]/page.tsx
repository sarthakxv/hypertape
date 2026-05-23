import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MarketDetailLive } from "@/components/markets/market-detail-live";
import { SWRProvider } from "@/components/providers/swr-provider";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";
import { marketDetailKey } from "@/lib/swr/types";
import { Card } from "@/components/ui/card";

type MarketPageProps = {
  params: Promise<{ marketId: string }>;
};

export const dynamic = "force-dynamic";

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { digest?: string }).digest === "NEXT_NOT_FOUND";
}

function sourceLabel(source: string): string {
  if (source === "live") return "Source: live Hyperliquid";
  return "Source: fixture tape";
}

export default async function MarketPage({ params }: MarketPageProps) {
  const { marketId } = await params;
  const provider = getMarketDataProvider(process.env);

  let market;
  let snapshots;
  let events;
  try {
    market = await provider.getMarket(marketId);
    if (!market) notFound();

    [snapshots, events] = await Promise.all([
      provider.getSnapshots(marketId),
      provider.getTapeEvents(marketId)
    ]);
  } catch (error) {
    // notFound() throws a Next.js control-flow signal; let it propagate.
    if (isNotFoundError(error)) throw error;
    return (
      <AppShell>
        <Card className="px-6 py-8" aria-labelledby="market-unavailable-heading">
          <h1 id="market-unavailable-heading" className="m-0 text-[28px] font-bold leading-[1.15]">
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
      <SWRProvider
        fallback={{
          [marketDetailKey(market.id)]: { source: provider.source, market, snapshots, events }
        }}
      >
        <MarketDetailLive market={market} snapshots={snapshots} events={events} sourceLabel={sourceLabel(provider.source)} />
      </SWRProvider>
    </AppShell>
  );
}
