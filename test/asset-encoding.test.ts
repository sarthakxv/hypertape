import { describe, expect, test } from "vitest";
import { buildOutcomeSide, getPrimaryAndDualSides } from "@/lib/hyperliquid/asset-encoding";

describe("HIP-4 asset encoding", () => {
  test("derives encoding, coin, token name, and asset id from outcome id and side", () => {
    expect(buildOutcomeSide(1, 0, "Yes")).toEqual({
      side: 0,
      label: "Yes",
      encoding: 10,
      coin: "#10",
      tokenName: "+10",
      assetId: 100000010
    });

    expect(buildOutcomeSide(1, 1, "No")).toEqual({
      side: 1,
      label: "No",
      encoding: 11,
      coin: "#11",
      tokenName: "+11",
      assetId: 100000011
    });
  });

  test("uses Yes as primary and No as dual when metadata confirms labels", () => {
    const sides = [buildOutcomeSide(42, 0, "No"), buildOutcomeSide(42, 1, "Yes")] as const;
    expect(getPrimaryAndDualSides(sides)).toEqual({ primarySide: 1, dualSide: 0 });
  });

  test("falls back to side 0 primary and side 1 dual for nonstandard labels", () => {
    const sides = [buildOutcomeSide(42, 0, "Over"), buildOutcomeSide(42, 1, "Under")] as const;
    expect(getPrimaryAndDualSides(sides)).toEqual({ primarySide: 0, dualSide: 1 });
  });
});
