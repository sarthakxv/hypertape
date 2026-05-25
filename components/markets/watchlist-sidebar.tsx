"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Star } from "lucide-react";
import type { MarketCard, MarketSnapshot } from "@/lib/hyperliquid/types";
import { formatPoints, formatProbability } from "@/lib/markets/probability";
import { readWatchlistFromStorage } from "@/lib/watchlist/storage";
import { watchlistChangedEvent } from "@/components/markets/watchlist-star";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type WatchlistSidebarProps = {
  markets: MarketCard[];
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
  const watchedMarkets = marketIds.map((marketId) => marketsById.get(marketId)).filter((market): market is MarketCard => Boolean(market));

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
    <Card className="sticky top-[82px] min-w-0" aria-labelledby="watchlist-heading">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border pb-3">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-chart-info">
            Watchlist
          </p>
          <h2 id="watchlist-heading" className="m-0 text-[17px] font-semibold leading-[1.2]">
            Alert queue
          </h2>
        </div>
        <Star size={17} aria-hidden="true" className="text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-0">
        {watchedMarkets.length === 0 ? (
          <div className="px-4 py-6 text-muted-foreground">
            <p className="m-0 text-sm font-bold text-foreground">No starred markets yet.</p>
            <span className="mt-1 block text-xs leading-relaxed">
              Use the star column to pin probability moves and stale books here.
            </span>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {watchedMarkets.map((market) => {
              const snapshot = latestSnapshots.get(market.id);

              return (
                <li key={market.id}>
                  <Link
                    href={`/markets/${market.id}`}
                    className="grid grid-cols-[1fr_auto] items-baseline gap-x-2 gap-y-0.5 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="truncate text-[13px] font-semibold text-foreground">{market.name}</span>
                    <strong className="text-right text-[13px] text-chart-positive">
                      {formatProbability(snapshot?.primaryMid ?? null)}
                    </strong>
                    <small className="col-span-2 text-xs text-muted-foreground">
                      Spread {snapshot?.canonicalSpread == null ? "-" : formatPoints(snapshot.canonicalSpread * 100)}
                    </small>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <div className="p-3.5">
          <Button
            variant="outline"
            size="sm"
            className="w-full cursor-not-allowed opacity-[0.72]"
            type="button"
            disabled
          >
            <Bell size={15} aria-hidden="true" />
            Telegram alerts disabled
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
