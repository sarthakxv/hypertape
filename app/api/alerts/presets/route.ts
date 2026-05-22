import { NextResponse } from "next/server";
import { alertPresets } from "@/lib/alerts/presets";

export async function GET() {
  return NextResponse.json({ presets: alertPresets });
}
