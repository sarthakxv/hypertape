import { describe, expect, test } from "vitest";
import {
  addMarketToWatchlist,
  readWatchlistFromStorage,
  removeMarketFromWatchlist,
  toggleMarketInWatchlist,
  watchlistStorageKey,
  writeWatchlistToStorage
} from "@/lib/watchlist/storage";

describe("watchlist storage helpers", () => {
  test("adds, removes, and toggles market ids without duplicates", () => {
    const empty = { marketIds: [], updatedAt: 1 };
    const added = addMarketToWatchlist(empty, "7", 2);
    expect(added).toEqual({ marketIds: ["7"], updatedAt: 2 });

    const addedAgain = addMarketToWatchlist(added, "7", 3);
    expect(addedAgain.marketIds).toEqual(["7"]);

    const toggledOff = toggleMarketInWatchlist(addedAgain, "7", 4);
    expect(toggledOff).toEqual({ marketIds: [], updatedAt: 4 });

    const removed = removeMarketFromWatchlist({ marketIds: ["7", "8"], updatedAt: 4 }, "7", 5);
    expect(removed).toEqual({ marketIds: ["8"], updatedAt: 5 });
  });

  test("reads malformed or unavailable storage as an empty watchlist", () => {
    expect(readWatchlistFromStorage(null)).toEqual({ marketIds: [], updatedAt: 0 });
    expect(
      readWatchlistFromStorage({
        getItem: () => "{bad json}",
        setItem: () => undefined
      })
    ).toEqual({ marketIds: [], updatedAt: 0 });
    expect(
      readWatchlistFromStorage({
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => undefined
      })
    ).toEqual({ marketIds: [], updatedAt: 0 });
  });

  test("normalizes stored ids and invalid timestamps", () => {
    const state = readWatchlistFromStorage({
      getItem: () => JSON.stringify({ marketIds: ["7", "7", 8, "9"], updatedAt: "now" }),
      setItem: () => undefined
    });

    expect(state).toEqual({ marketIds: ["7", "9"], updatedAt: 0 });
  });

  test("ignores unavailable storage writes without throwing", () => {
    const writes: string[] = [];
    expect(() =>
      writeWatchlistToStorage(
        {
          getItem: () => null,
          setItem: (key, value) => {
            writes.push(`${key}:${value}`);
          }
        },
        { marketIds: ["7", "7"], updatedAt: 11 }
      )
    ).not.toThrow();

    expect(writes).toEqual([`${watchlistStorageKey}:{"marketIds":["7"],"updatedAt":11}`]);
    expect(() =>
      writeWatchlistToStorage(
        {
          getItem: () => null,
          setItem: () => {
            throw new Error("quota");
          }
        },
        { marketIds: ["7"], updatedAt: 11 }
      )
    ).not.toThrow();
  });
});
