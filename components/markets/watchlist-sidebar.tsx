"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Star } from "lucide-react";
import type { Market, MarketSnapshot } from "@/lib/hyperliquid/types";
import { formatPoints, formatProbability } from "@/lib/markets/probability";
import { readWatchlistFromStorage } from "@/lib/watchlist/storage";
import { watchlistChangedEvent } from "@/components/markets/watchlist-star";

type WatchlistSidebarProps = {
  markets: Market[];
  snapshots: MarketSnapshot[];
};

function latestSnapshotsByMarket(snapshots: MarketSnapshot[]): Map<string, MarketSnapshot> {
  return snapshots.reduce((latestByMarket, snapshot) => {
    const current = latestByMarket.get(snapshot.marketId);
    if (!current || snapshot.timestamp > current.timestamp) {
      latestByMarket.set(snapshot.marketId, snapshot);
    }
    return latestByMarket;
  }, new Map<string, MarketSnapshot>());
}

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function WatchlistSidebar({ markets, snapshots }: WatchlistSidebarProps) {
  const [marketIds, setMarketIds] = useState<string[]>([]);
  const latestSnapshots = useMemo(() => latestSnapshotsByMarket(snapshots), [snapshots]);
  const marketsById = useMemo(() => new Map(markets.map((market) => [market.id, market])), [markets]);
  const watchedMarkets = marketIds.map((marketId) => marketsById.get(marketId)).filter((market): market is Market => Boolean(market));

  useEffect(() => {
    function syncState() {
      setMarketIds(readWatchlistFromStorage(getStorage()).marketIds);
    }

    syncState();
    window.addEventListener("storage", syncState);
    window.addEventListener(watchlistChangedEvent, syncState);

    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener(watchlistChangedEvent, syncState);
    };
  }, []);

  return (
    <aside className="panel watchlist-panel" aria-labelledby="watchlist-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Watchlist</p>
          <h2 id="watchlist-heading">Alert queue</h2>
        </div>
        <Star size={17} aria-hidden="true" />
      </div>

      {watchedMarkets.length === 0 ? (
        <div className="empty-state">
          <p>No starred markets yet.</p>
          <span>Use the star column to pin probability moves and stale books here.</span>
        </div>
      ) : (
        <ul className="watchlist-list">
          {watchedMarkets.map((market) => {
            const snapshot = latestSnapshots.get(market.id);

            return (
              <li key={market.id}>
                <Link href={`/markets/${market.id}`}>
                  <span>{market.name}</span>
                  <strong>{formatProbability(snapshot?.primaryMid ?? null)}</strong>
                  <small>
                    Spread {snapshot?.canonicalSpread == null ? "-" : formatPoints(snapshot.canonicalSpread * 100)}
                  </small>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <button className="telegram-cta" type="button" disabled>
        <Bell size={15} aria-hidden="true" />
        Telegram alerts disabled
      </button>
    </aside>
  );
}
