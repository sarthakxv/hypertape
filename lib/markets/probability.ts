export type ProbabilityDelta = {
  previous: number;
  current: number;
  delta: number;
  deltaPoints: number;
};

export function calculateMid(bestBid: number | null, bestAsk: number | null): number | null {
  if (bestBid == null || bestAsk == null) return null;
  return (bestBid + bestAsk) / 2;
}

export function calculateSpread(bestBid: number | null, bestAsk: number | null): number | null {
  if (bestBid == null || bestAsk == null) return null;
  return bestAsk - bestBid;
}

export function calculateProbabilityDelta(previous: number, current: number): ProbabilityDelta {
  const delta = current - previous;
  return {
    previous,
    current,
    delta,
    deltaPoints: delta * 100
  };
}

export function formatProbability(value: number | null): string {
  if (value == null) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPoints(value: number | null): string {
  if (value == null) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} pts`;
}
