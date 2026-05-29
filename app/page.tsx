import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";

const NOISE_DATA_URI =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Animated aurora background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {/* Hero photo with slow Ken Burns drift */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/illustrations/landing-background.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="hypertape-hero-photo object-cover"
          />
        </div>
        {/* Dark gradient over the photo to keep text legible */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(4, 6, 12, 0.45) 0%, rgba(4, 6, 12, 0.3) 40%, rgba(4, 6, 12, 0.72) 100%)"
          }}
        />
        <div
          className="hypertape-aurora hypertape-aurora-1"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(149, 242, 220, 0.18), rgba(149, 242, 220, 0.06) 35%, transparent 65%)",
            filter: "blur(60px)"
          }}
        />
        <div
          className="hypertape-aurora hypertape-aurora-2"
          style={{
            background:
              "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(90, 176, 160, 0.14), rgba(90, 176, 160, 0.05) 40%, transparent 70%)",
            filter: "blur(70px)"
          }}
        />
        <div
          className="hypertape-aurora hypertape-aurora-3"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(127, 165, 184, 0.12), transparent 65%)",
            filter: "blur(70px)"
          }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 30%, rgba(0, 0, 0, 0.28) 100%)"
          }}
        />
        {/* Film-grain noise */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-soft-light"
          style={{ backgroundImage: NOISE_DATA_URI }}
        />
      </div>

      {/* Top navigation */}
      <header className="relative z-10 flex items-center justify-end px-5 py-5 sm:px-10 sm:py-7">
        <Link
          href="/app"
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-[transform,opacity] hover:-translate-y-0.5 hover:opacity-90"
        >
          Launch App
        </Link>
      </header>

      {/* Spacer pushes the hero to the bottom */}
      <div className="flex-1" />

      {/* Bottom row: hero content left, footer right */}
      <div className="relative z-10 flex flex-col gap-8 px-5 pb-7 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:pb-9">
        {/* Hero content, bottom-left */}
        <div className="max-w-2xl">
          <Image
            src="/assets/logo-text.svg"
            alt="Hypertape"
            width={584}
            height={113}
            priority
            className="h-auto w-[clamp(207px,39.6vw,576px)]"
          />

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground/90">
              Powered by
              <Image
                src="/assets/hl-logo-white.svg"
                alt="Hyperliquid"
                width={90}
                height={14}
              />
            </span>
            <span aria-hidden className="text-muted-foreground/30">&middot;</span>
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground/90">
              Charts by
              <Image
                src="/assets/tv-logo-white.svg"
                alt="TradingView"
                width={100}
                height={17}
              />
            </span>
          </div>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/75 sm:text-lg">
            The live probability tape for Hyperliquid outcome markets.<br />Discovery, analysis,
            and real-time odds; every spread, depth, and probability move on one surface.
          </p>

          <Link
            href="/app"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-base font-medium text-primary-foreground shadow-[0_0_40px_-8px_rgba(80,210,193,0.5)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_0_56px_-6px_rgba(80,210,193,0.65)]"
          >
            Launch App
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* Footer, bottom-right */}
        <div className="flex flex-row items-center gap-4 text-muted-foreground sm:flex-col sm:items-end sm:gap-2.5">
          <a
            href="mailto:sarthakvdev@gmail.com"
            aria-label="Email"
            className="transition-colors hover:text-foreground"
          >
            <Mail className="size-5" aria-hidden="true" />
          </a>
          <span className="text-[12px] text-muted-foreground/70">
            &copy; {new Date().getFullYear()} Hypertape
          </span>
        </div>
      </div>
    </div>
  );
}
