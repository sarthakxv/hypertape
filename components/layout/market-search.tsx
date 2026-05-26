"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import useSWR from "swr";
import { liveFetcher, liveSWRConfig } from "@/lib/swr/config";
import { LIVE_KEY, type LiveResponse } from "@/lib/swr/types";
import type { MarketCard } from "@/lib/hyperliquid/types";
import { cn } from "@/lib/utils";

const MAX_RESULTS = 8;

const STATUS_RANK: Record<string, number> = {
  active: 0,
  settling: 1,
  settled: 2,
  unknown: 3
};

function matches(market: MarketCard, query: string): boolean {
  const haystack = `${market.name} ${market.underlying ?? ""} ${market.id}`.toLowerCase();
  return haystack.includes(query);
}

export function MarketSearch() {
  const router = useRouter();
  const { data } = useSWR<LiveResponse>(LIVE_KEY, liveFetcher, liveSWRConfig);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const results = useMemo(() => {
    const markets = data?.markets ?? [];
    const trimmed = query.trim().toLowerCase();
    const pool = trimmed ? markets.filter((m) => matches(m, trimmed)) : markets;
    return [...pool]
      .sort((a, b) => (STATUS_RANK[a.status] ?? 3) - (STATUS_RANK[b.status] ?? 3))
      .slice(0, MAX_RESULTS);
  }, [data, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function select(market: MarketCard) {
    setOpen(false);
    setQuery("");
    router.push(`/markets/${market.id}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      const market = results[activeIndex];
      if (market) {
        event.preventDefault();
        select(market);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && results.length > 0;
  const optionId = (index: number) => `${listboxId}-opt-${index}`;

  return (
    <div ref={containerRef} className="relative flex min-w-40 flex-1 sm:min-w-[220px]">
      <div
        role="combobox"
        aria-expanded={showList}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-[#0b0f15] px-3 py-2.5 text-muted-foreground focus-within:border-ring"
      >
        <Search size={16} aria-hidden="true" />
        <span id={`${listboxId}-label`} className="sr-only">
          Search HIP-4 markets
        </span>
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-[#6f7b8e]"
          placeholder="Search HIP-4 markets"
          value={query}
          aria-labelledby={`${listboxId}-label`}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={showList ? optionId(activeIndex) : undefined}
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </div>

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Markets"
          className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-80 overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg shadow-black/40"
        >
          {results.map((market, index) => (
            <li
              key={market.id}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "cursor-pointer px-3 py-2",
                index === activeIndex ? "bg-[#161c26]" : "hover:bg-[#11161f]"
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                select(market);
              }}
            >
              <span className="block truncate text-sm text-foreground">{market.name}</span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {[market.underlying, market.status].filter(Boolean).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
