"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  readWatchlistFromStorage,
  toggleMarketInWatchlist,
  writeWatchlistToStorage
} from "@/lib/watchlist/storage";

type WatchlistStarProps = {
  marketId: string;
  marketName: string;
};

export const watchlistChangedEvent = "hypertape-watchlist-change";

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readIsStarred(marketId: string): boolean {
  return readWatchlistFromStorage(getStorage()).marketIds.includes(marketId);
}

export function WatchlistStar({ marketId, marketName }: WatchlistStarProps) {
  const [isStarred, setIsStarred] = useState(false);

  useEffect(() => {
    function syncState() {
      setIsStarred(readIsStarred(marketId));
    }

    syncState();
    window.addEventListener("storage", syncState);
    window.addEventListener(watchlistChangedEvent, syncState);

    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener(watchlistChangedEvent, syncState);
    };
  }, [marketId]);

  function toggleStar() {
    const storage = getStorage();
    const nextState = toggleMarketInWatchlist(readWatchlistFromStorage(storage), marketId);
    writeWatchlistToStorage(storage, nextState);
    setIsStarred(nextState.marketIds.includes(marketId));
    window.dispatchEvent(new Event(watchlistChangedEvent));
  }

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded transition-colors",
        "text-muted-foreground hover:bg-accent/20 hover:text-foreground",
        isStarred && "text-chart-warning hover:text-chart-warning"
      )}
      onClick={toggleStar}
      aria-label={`${isStarred ? "Remove" : "Add"} ${marketName} ${isStarred ? "from" : "to"} watchlist`}
      aria-pressed={isStarred}
    >
      <Star size={16} aria-hidden="true" fill={isStarred ? "currentColor" : "none"} />
    </button>
  );
}
