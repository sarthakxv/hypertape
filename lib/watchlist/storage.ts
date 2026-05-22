import type { WatchlistState } from "@/lib/hyperliquid/types";

export const watchlistStorageKey = "hypertape.watchlist";

export const emptyWatchlistState: WatchlistState = {
  marketIds: [],
  updatedAt: 0
};

type WatchlistStorage = Pick<Storage, "getItem" | "setItem">;

function normalizeState(value: unknown): WatchlistState {
  if (typeof value !== "object" || value == null) return emptyWatchlistState;

  const candidate = value as Partial<WatchlistState>;
  const marketIds = Array.isArray(candidate.marketIds)
    ? Array.from(new Set(candidate.marketIds.filter((id): id is string => typeof id === "string")))
    : [];

  return {
    marketIds,
    updatedAt: typeof candidate.updatedAt === "number" ? candidate.updatedAt : 0
  };
}

export function addMarketToWatchlist(
  state: WatchlistState,
  marketId: string,
  updatedAt = Date.now()
): WatchlistState {
  if (state.marketIds.includes(marketId)) {
    return {
      marketIds: state.marketIds,
      updatedAt
    };
  }

  return {
    marketIds: [...state.marketIds, marketId],
    updatedAt
  };
}

export function removeMarketFromWatchlist(
  state: WatchlistState,
  marketId: string,
  updatedAt = Date.now()
): WatchlistState {
  return {
    marketIds: state.marketIds.filter((id) => id !== marketId),
    updatedAt
  };
}

export function toggleMarketInWatchlist(
  state: WatchlistState,
  marketId: string,
  updatedAt = Date.now()
): WatchlistState {
  return state.marketIds.includes(marketId)
    ? removeMarketFromWatchlist(state, marketId, updatedAt)
    : addMarketToWatchlist(state, marketId, updatedAt);
}

export function readWatchlistFromStorage(storage: WatchlistStorage | null | undefined): WatchlistState {
  if (!storage) return emptyWatchlistState;

  try {
    const rawState = storage.getItem(watchlistStorageKey);
    if (!rawState) return emptyWatchlistState;
    return normalizeState(JSON.parse(rawState));
  } catch {
    return emptyWatchlistState;
  }
}

export function writeWatchlistToStorage(
  storage: WatchlistStorage | null | undefined,
  state: WatchlistState
): void {
  if (!storage) return;

  try {
    storage.setItem(watchlistStorageKey, JSON.stringify(normalizeState(state)));
  } catch {
    // Restricted browsers can deny localStorage writes. Keep the UI usable.
  }
}
