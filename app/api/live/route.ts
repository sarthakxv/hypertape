import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

export const dynamic = "force-dynamic";

// Combined live feed: markets, snapshots, and tape in one payload so a page can
// poll a single endpoint instead of three. The provider's module-level TTL cache
// dedupes the upstream Hyperliquid calls across all polling clients.
export async function GET() {
  try {
    const provider = getMarketDataProvider(process.env);
    const [markets, snapshots, events] = await Promise.all([
      provider.getMarkets(),
      provider.getSnapshots(),
      provider.getTapeEvents()
    ]);

    return NextResponse.json({ source: provider.source, markets, snapshots, events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ source: "live", markets: [], snapshots: [], events: [], error: message });
  }
}
