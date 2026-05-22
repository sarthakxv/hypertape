import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const provider = getMarketDataProvider(process.env);
    const events = await provider.getTapeEvents();

    return NextResponse.json({
      source: provider.source,
      events
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ source: "live", events: [], error: message });
  }
}
