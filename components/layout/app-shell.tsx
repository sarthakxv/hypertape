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
      <header className="sticky top-0 z-10 flex min-h-[68px] flex-wrap items-center gap-4 border-b border-border bg-card/95 px-6 backdrop-blur-sm">
        <Link className="flex shrink-0 items-center gap-2.5" href="/" aria-label="Hypertape home">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-primary/30 bg-[#0b1714]">
            <Image
              src="/assets/hypertape-logo.svg"
              alt=""
              width={20}
              height={21}
              priority
            />
          </span>
          <Image
            src="/assets/logo-text.svg"
            alt="Hypertape"
            width={140}
            height={27}
            priority
          />
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

        <label className="flex min-w-[220px] flex-1 cursor-not-allowed items-center gap-2 rounded-lg border border-border bg-[#0b0f15] px-3 py-2.5 text-muted-foreground opacity-[0.72]">
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

      <main className="mx-auto w-full max-w-[1680px] px-6 py-[22px] pb-9">
        {children}
      </main>
    </div>
  );
}
