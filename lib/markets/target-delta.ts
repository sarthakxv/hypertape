export type TargetDelta = {
  target: number;
  current: number | null;
  delta: number | null;
  deltaPct: number | null;
};

/**
 * Derives the Target/Current/Δ view-model for a priceBinary market.
 * Returns null when there is no target (caller hides the widget). When the target
 * exists but the underlying spot is missing, current/delta/deltaPct are null.
 */
export function deriveTargetDelta(
  target: number | undefined,
  current: number | null | undefined
): TargetDelta | null {
  if (target == null) return null;
  if (current == null) {
    return { target, current: null, delta: null, deltaPct: null };
  }
  const delta = current - target;
  const deltaPct = target !== 0 ? delta / target : null;
  return { target, current, delta, deltaPct };
}

/**
 * Formats a signed delta as "↑ +$343 (+0.45%)" / "↓ -$337 (-0.43%)". Returns an
 * em-dash when delta is null, and omits the percent segment when deltaPct is null.
 */
export function formatSignedDelta(delta: number | null, deltaPct: number | null): string {
  if (delta == null) return "—";
  const arrow = delta >= 0 ? "↑" : "↓";
  const sign = delta >= 0 ? "+" : "-";
  const abs = Math.abs(delta).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const pct =
    deltaPct == null
      ? ""
      : ` (${deltaPct >= 0 ? "+" : "-"}${Math.abs(deltaPct * 100).toFixed(2)}%)`;
  return `${arrow} ${sign}$${abs}${pct}`;
}
