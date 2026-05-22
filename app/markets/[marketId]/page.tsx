import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MarketDetailLive } from "@/components/markets/market-detail-live";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

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
        <section className="panel empty-state" aria-labelledby="market-unavailable-heading">
          <h1 id="market-unavailable-heading">Live data unavailable</h1>
          <span>We could not reach Hyperliquid right now. Try again shortly.</span>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MarketDetailLive market={market} snapshots={snapshots} events={events} sourceLabel={sourceLabel(provider.source)} />
    </AppShell>
  );
}
