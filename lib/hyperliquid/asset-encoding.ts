import type { OutcomeSide } from "./types";

export function buildOutcomeSide(outcomeId: number, side: 0 | 1, label: string): OutcomeSide {
  const encoding = 10 * outcomeId + side;

  return {
    side,
    label,
    encoding,
    coin: `#${encoding}`,
    tokenName: `+${encoding}`,
    assetId: 100000000 + encoding
  };
}

export function getPrimaryAndDualSides(sides: readonly [OutcomeSide, OutcomeSide]): {
  primarySide: 0 | 1;
  dualSide: 0 | 1;
} {
  const yesSide = sides.find((side) => side.label.toLowerCase() === "yes")?.side;
  const noSide = sides.find((side) => side.label.toLowerCase() === "no")?.side;

  if (yesSide !== undefined && noSide !== undefined && yesSide !== noSide) {
    return { primarySide: yesSide, dualSide: noSide };
  }

  return { primarySide: 0, dualSide: 1 };
}
