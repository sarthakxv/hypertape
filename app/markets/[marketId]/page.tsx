import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MarketDetail } from "@/components/markets/market-detail";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

type MarketPageProps = {
  params: Promise<{ marketId: string }>;
};

function sourceLabel(source: string): string {
  if (source === "live") return "Source: live Hyperliquid";
  if (source === "live-with-fixture-fallback") return "Source: fixture fallback";
  return "Source: fixture tape";
}

export default async function MarketPage({ params }: MarketPageProps) {
  const { marketId } = await params;
  const provider = getMarketDataProvider(process.env);
  const market = await provider.getMarket(marketId);

  if (!market) notFound();

  const [snapshots, events] = await Promise.all([
    provider.getSnapshots(marketId),
    provider.getTapeEvents(marketId)
  ]);

  return (
    <AppShell>
      <MarketDetail market={market} snapshots={snapshots} events={events} sourceLabel={sourceLabel(provider.source)} />
    </AppShell>
  );
}
