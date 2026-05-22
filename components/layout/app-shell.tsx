import Link from "next/link";
import { Bell, Search } from "lucide-react";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="shell-header">
        <Link className="brand-lockup" href="/" aria-label="Hypertape home">
          <span className="brand-mark">H</span>
          <span>
            <span className="brand-name">Hypertape</span>
            <span className="brand-subtitle">HIP-4 probability tape</span>
          </span>
        </Link>

        <nav className="shell-nav" aria-label="Primary navigation">
          <Link href="/markets">Markets</Link>
          <Link href="/alerts">Alerts</Link>
        </nav>

        <label className="shell-search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search HIP-4 markets</span>
          <input placeholder="Search HIP-4 markets" disabled />
        </label>

        <button className="alert-cta" type="button" disabled>
          <Bell size={16} aria-hidden="true" />
          Alert drafts
        </button>
      </header>

      <main className="shell-main">{children}</main>
    </div>
  );
}
