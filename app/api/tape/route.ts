import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

export async function GET() {
  const provider = getMarketDataProvider(process.env);
  const events = await provider.getTapeEvents();

  return NextResponse.json({
    source: provider.source,
    events
  });
}
