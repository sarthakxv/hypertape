import { describe, expect, test } from "vitest";
import { classifyMove } from "@/lib/tape/severity";

describe("move severity", () => {
  test("classifies moves by point threshold inside fifteen minutes", () => {
    expect(classifyMove(1.9, 15 * 60)).toBe("none");
    expect(classifyMove(2, 15 * 60)).toBe("low");
    expect(classifyMove(5, 15 * 60)).toBe("medium");
    expect(classifyMove(10, 15 * 60)).toBe("high");
  });

  test("returns none when the move is outside the window", () => {
    expect(classifyMove(20, 16 * 60)).toBe("none");
  });
});
