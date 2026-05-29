"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketSearch } from "@/components/layout/market-search";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex min-h-17 flex-wrap items-center gap-3 border-b border-border bg-card/95 px-4 py-3 sm:py-0 sm:gap-4 sm:px-6 backdrop-blur-sm">
        <Link className="flex shrink-0 items-center gap-2.5" href="/app" aria-label="Hypertape home">
          <span className="flex size-8.5 items-center justify-center">
            <Image
              src="/assets/hypertape-logo.svg"
              alt=""
              width={20}
              height={21}
              priority
            />
          </span>
          <span className="-mb-1">
            <Image
              src="/assets/logo-text.svg"
              alt="Hypertape"
              width={120}
              height={20}
              priority
            />
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Primary navigation">
          <Link
            href="/markets"
            className={cn(
              "rounded px-2.5 py-2 text-[13px] transition-colors",
              pathname === "/markets" || pathname.startsWith("/markets/")
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:bg-card hover:text-foreground"
            )}
          >
            Markets
          </Link>
          <Link
            href="/alerts"
            className={cn(
              "rounded px-2.5 py-2 text-[13px] transition-colors",
              pathname === "/alerts"
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:bg-card hover:text-foreground"
            )}
          >
            Alerts
          </Link>
        </nav>

        <MarketSearch />

        <Button type="button" disabled size="sm" className="py-5 rounded hidden shrink-0 sm:flex">
          <Bell size={16} aria-hidden="true" />
          Alert drafts
        </Button>
      </header>

      <main className="mx-auto w-full max-w-420 px-4 py-5 pb-9 sm:px-6 sm:py-5.5">
        {children}
      </main>
    </div>
  );
}
