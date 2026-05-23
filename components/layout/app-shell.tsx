import Image from "next/image";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex min-h-17 flex-wrap items-center gap-3 border-b border-border bg-card/95 px-4 sm:gap-4 sm:px-6 backdrop-blur-sm">
        <Link className="flex shrink-0 items-center gap-2.5" href="/" aria-label="Hypertape home">
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
            className="rounded px-2.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            Markets
          </Link>
          <Link
            href="/alerts"
            className="rounded px-2.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            Alerts
          </Link>
        </nav>

        <label className="flex min-w-40 flex-1 cursor-not-allowed items-center gap-2 rounded-lg border border-border bg-[#0b0f15] px-3 py-2.5 text-muted-foreground opacity-[0.72] sm:min-w-[220px]">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search HIP-4 markets</span>
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-[#6f7b8e] disabled:cursor-not-allowed"
            placeholder="Search HIP-4 markets"
            disabled
          />
        </label>

        <Button type="button" disabled size="sm" className="shrink-0">
          <Bell size={16} aria-hidden="true" />
          Alert drafts
        </Button>
      </header>

      <main className="mx-auto w-full max-w-[1680px] px-4 py-5 pb-9 sm:px-6 sm:py-[22px]">
        {children}
      </main>
    </div>
  );
}
