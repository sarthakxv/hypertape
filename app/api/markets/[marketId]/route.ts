import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ marketId: string }> }) {
  const { marketId } = await context.params;

  try {
    const provider = getMarketDataProvider(process.env);
    const market = await provider.getMarket(marketId);

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    const snapshots = await provider.getSnapshots(marketId);
    const events = await provider.getTapeEvents(marketId);

    return NextResponse.json({
      source: provider.source,
      market,
      snapshots,
      events
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ source: "live", market: null, snapshots: [], events: [], error: message });
  }
}
