import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LiveTape } from "@/components/tape/live-tape";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";
import { formatPoints, formatProbability } from "@/lib/markets/probability";

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
  const latestSnapshot = snapshots.toSorted((left, right) => right.timestamp - left.timestamp)[0];

  return (
    <AppShell>
      <section className="command-header" aria-labelledby="market-heading">
        <div>
          <p className="eyebrow">Market Detail</p>
          <h1 id="market-heading">{market.name}</h1>
        </div>
        <span className="source-marker">{sourceLabel(provider.source)}</span>
      </section>

      <section className="detail-grid" aria-label="Current market state">
        <article className="mover-tile">
          <span>{market.sides.find((side) => side.side === market.primarySide)?.label ?? "Primary"} probability</span>
          <strong>{formatProbability(latestSnapshot?.primaryMid ?? null)}</strong>
          <small>Bid {formatProbability(latestSnapshot?.primaryBestBid ?? null)} / Ask {formatProbability(latestSnapshot?.primaryBestAsk ?? null)}</small>
        </article>
        <article className="mover-tile">
          <span>Spread</span>
          <strong>{latestSnapshot?.canonicalSpread == null ? "-" : formatPoints(latestSnapshot.canonicalSpread * 100)}</strong>
          <small>Canonical two-sided book</small>
        </article>
        <article className="mover-tile">
          <span>Depth within 5 pts</span>
          <strong>{latestSnapshot?.totalDepthFivePoints == null ? "-" : `$${latestSnapshot.totalDepthFivePoints.toLocaleString("en-US")}`}</strong>
          <small>Quote token {market.quoteToken ?? "unknown"}</small>
        </article>
      </section>

      <LiveTape events={events} />
    </AppShell>
  );
}
