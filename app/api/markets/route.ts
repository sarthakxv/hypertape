import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const provider = getMarketDataProvider(process.env);
    const markets = await provider.getMarkets();
    const snapshots = await provider.getSnapshots();

    return NextResponse.json({
      source: provider.source,
      markets,
      snapshots
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ source: "live", markets: [], snapshots: [], error: message });
  }
}
