import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

export async function GET() {
  const provider = getMarketDataProvider(process.env);
  const markets = await provider.getMarkets();
  const snapshots = await provider.getSnapshots();

  return NextResponse.json({
    source: provider.source,
    markets,
    snapshots
  });
}
