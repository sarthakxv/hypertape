export type MoveSeverity = "none" | "low" | "medium" | "high";

export function classifyMove(deltaPointsAbs: number, windowSeconds: number): MoveSeverity {
  if (windowSeconds <= 15 * 60 && deltaPointsAbs >= 10) return "high";
  if (windowSeconds <= 15 * 60 && deltaPointsAbs >= 5) return "medium";
  if (windowSeconds <= 15 * 60 && deltaPointsAbs >= 2) return "low";
  return "none";
}
