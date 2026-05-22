import type { Market, MarketSnapshot, TapeEvent } from "@/lib/hyperliquid/types";
import { calculateProbabilityDelta } from "@/lib/markets/probability";
import { classifyMove } from "@/lib/tape/severity";

const severityRank: Record<TapeEvent["severity"], number> = {
  high: 3,
  medium: 2,
  low: 1
};

function groupSnapshotsByMarket(snapshots: MarketSnapshot[]): Map<string, MarketSnapshot[]> {
  const grouped = new Map<string, MarketSnapshot[]>();

  for (const snapshot of snapshots) {
    const marketSnapshots = grouped.get(snapshot.marketId) ?? [];
    marketSnapshots.push(snapshot);
    grouped.set(snapshot.marketId, marketSnapshots);
  }

  for (const marketSnapshots of grouped.values()) {
    marketSnapshots.sort((a, b) => a.timestamp - b.timestamp);
  }

  return grouped;
}

function formatProbability(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDeltaPoints(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} pts`;
}

function getSideLabel(market: Market, side: 0 | 1): string {
  return market.sides.find((candidate) => candidate.side === side)?.label ?? "Primary";
}

function getPrimaryMidFromTwoSidedQuote(snapshot: MarketSnapshot): number | null {
  if (snapshot.primaryBestBid == null || snapshot.primaryBestAsk == null || snapshot.primaryMid == null) {
    return null;
  }

  return snapshot.primaryMid;
}

export function generateProbabilityMoveEvents(
  markets: Market[],
  snapshots: MarketSnapshot[],
  windowSeconds: number
): TapeEvent[] {
  const marketsById = new Map(markets.map((market) => [market.id, market]));
  const snapshotsByMarket = groupSnapshotsByMarket(snapshots);
  const events: TapeEvent[] = [];

  for (const [marketId, marketSnapshots] of snapshotsByMarket.entries()) {
    const market = marketsById.get(marketId);
    if (!market || marketSnapshots.length < 2) continue;

    const currentSnapshot = marketSnapshots[marketSnapshots.length - 1];
    const windowStart = currentSnapshot.timestamp - windowSeconds * 1000;
    const previousSnapshot = marketSnapshots.find((candidate) => candidate.timestamp >= windowStart);
    if (!previousSnapshot || previousSnapshot === currentSnapshot) continue;
    if (previousSnapshot.primarySide !== currentSnapshot.primarySide) continue;
    const previousMid = getPrimaryMidFromTwoSidedQuote(previousSnapshot);
    const currentMid = getPrimaryMidFromTwoSidedQuote(currentSnapshot);
    if (previousMid == null || currentMid == null) continue;

    const probabilityDelta = calculateProbabilityDelta(previousMid, currentMid);
    const severity = classifyMove(Math.abs(probabilityDelta.deltaPoints), windowSeconds);
    if (severity === "none") continue;

    const side = getSideLabel(market, currentSnapshot.primarySide);
    const deltaText = formatDeltaPoints(probabilityDelta.deltaPoints);
    const currentText = formatProbability(probabilityDelta.current);

    events.push({
      id: `${market.id}:probability_move:${currentSnapshot.timestamp}:${windowSeconds}`,
      marketId: market.id,
      timestamp: currentSnapshot.timestamp,
      eventType: "probability_move",
      side,
      previousProbability: probabilityDelta.previous,
      currentProbability: probabilityDelta.current,
      delta: probabilityDelta.delta,
      windowSeconds,
      spread: currentSnapshot.canonicalSpread ?? undefined,
      depth: currentSnapshot.totalDepthOnePoint ?? undefined,
      volume: currentSnapshot.recentVolume ?? undefined,
      severity,
      title: `${side} moved ${deltaText}`,
      summary: `${market.name} moved to ${currentText} over ${Math.round(windowSeconds / 60)}m.`
    });
  }

  return rankTapeEvents(events);
}

export function rankTapeEvents(events: TapeEvent[]): TapeEvent[] {
  return [...events].sort((a, b) => {
    const severityDifference = severityRank[b.severity] - severityRank[a.severity];
    if (severityDifference !== 0) return severityDifference;

    const deltaDifference = Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0);
    if (deltaDifference !== 0) return deltaDifference;

    return b.timestamp - a.timestamp;
  });
}
