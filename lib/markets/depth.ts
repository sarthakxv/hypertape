import type { BookLevel } from "@/lib/hyperliquid/types";

export type DepthWithinPoints = {
  bidDepth: number;
  askDepth: number;
  totalDepth: number;
};

export function depthWithinPoints(
  bids: BookLevel[],
  asks: BookLevel[],
  mid: number,
  points: number
): DepthWithinPoints {
  const band = points / 100;
  const lower = mid - band;
  const upper = mid + band;

  const bidDepth = bids
    .filter((level) => level.price >= lower && level.price <= mid)
    .reduce((sum, level) => sum + level.price * level.size, 0);

  const askDepth = asks
    .filter((level) => level.price >= mid && level.price <= upper)
    .reduce((sum, level) => sum + level.price * level.size, 0);

  return {
    bidDepth,
    askDepth,
    totalDepth: bidDepth + askDepth
  };
}
