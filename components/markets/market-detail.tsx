import { Bell, Clock, Database, Info, Radio, SlidersHorizontal } from "lucide-react";
import { ProbabilityChart } from "@/components/charts/probability-chart";
import { LiveTape } from "@/components/tape/live-tape";
import type { BookLevel, Market, MarketSnapshot, TapeEvent } from "@/lib/hyperliquid/types";
import { formatPoints, formatProbability } from "@/lib/markets/probability";

type MarketDetailProps = {
  market: Market;
  snapshots: MarketSnapshot[];
  events: TapeEvent[];
  sourceLabel: string;
};

type DepthBand = {
  label: string;
  bidDepth: number | null;
  askDepth: number | null;
  totalDepth: number | null;
};

function compactCurrency(value: number | null | undefined): string {
  if (value == null) return "-";
  return `$${Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2
  }).format(value)}`;
}

function fullCurrency(value: number | null | undefined): string {
  if (value == null) return "-";
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatExpiry(value: string | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
    timeZoneName: "short"
  }).format(new Date(value));
}

function formatTimestamp(value: number | null | undefined): string {
  if (value == null) return "-";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
    timeZoneName: "short"
  }).format(new Date(value));
}

function latestSnapshot(snapshots: MarketSnapshot[]): MarketSnapshot | undefined {
  return [...snapshots].sort((left, right) => right.timestamp - left.timestamp)[0];
}

function sideLabel(market: Market, side: 0 | 1): string {
  return market.sides.find((candidate) => candidate.side === side)?.label ?? `Side ${side}`;
}

function orderbookRows(bids: BookLevel[], asks: BookLevel[]) {
  const rowCount = Math.max(bids.length, asks.length);
  return Array.from({ length: rowCount }, (_, index) => ({
    bid: bids[index],
    ask: asks[index]
  }));
}

function rawMetadata(raw: unknown): string {
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return "Raw metadata could not be serialized.";
  }
}

export function MarketDetail({ market, snapshots, events, sourceLabel }: MarketDetailProps) {
  const latest = latestSnapshot(snapshots);
  const primaryLabel = sideLabel(market, market.primarySide);
  const dualLabel = sideLabel(market, market.dualSide);
  const depthBands: DepthBand[] = [
    {
      label: "1 point",
      bidDepth: latest?.bidDepthOnePoint ?? null,
      askDepth: latest?.askDepthOnePoint ?? null,
      totalDepth: latest?.totalDepthOnePoint ?? null
    },
    {
      label: "3 points",
      bidDepth: latest?.bidDepthThreePoints ?? null,
      askDepth: latest?.askDepthThreePoints ?? null,
      totalDepth: latest?.totalDepthThreePoints ?? null
    },
    {
      label: "5 points",
      bidDepth: latest?.bidDepthFivePoints ?? null,
      askDepth: latest?.askDepthFivePoints ?? null,
      totalDepth: latest?.totalDepthFivePoints ?? null
    }
  ];

  return (
    <>
      <section className="command-header market-command-header" aria-labelledby="market-heading">
        <div>
          <p className="eyebrow">Market Detail</p>
          <h1 id="market-heading">{market.name}</h1>
          <div className="market-header-meta" aria-label="Market metadata">
            <span>Outcome {market.outcomeId}</span>
            <span>Quote {market.quoteToken ?? "unknown"}</span>
            <span>Expiry {formatExpiry(market.expiryTime)}</span>
            <span className={`status-pill status-${market.status}`}>{market.status}</span>
            <span>{market.statusSource} status</span>
          </div>
        </div>
        <span className="source-marker">{sourceLabel}</span>
      </section>

      <section className="market-stat-grid" aria-label="Current probabilities and book">
        <article className="mover-tile">
          <span>{primaryLabel} probability</span>
          <strong>{formatProbability(latest?.primaryMid ?? null)}</strong>
          <small>Bid {formatProbability(latest?.primaryBestBid ?? null)} / Ask {formatProbability(latest?.primaryBestAsk ?? null)}</small>
        </article>
        <article className="mover-tile">
          <span>{dualLabel} probability</span>
          <strong>{formatProbability(latest?.dualMid ?? null)}</strong>
          <small>Bid {formatProbability(latest?.dualBestBid ?? null)} / Ask {formatProbability(latest?.dualBestAsk ?? null)}</small>
        </article>
        <article className="mover-tile">
          <span>Spread</span>
          <strong>{latest?.canonicalSpread == null ? "-" : formatPoints(latest.canonicalSpread * 100)}</strong>
          <small>Canonical bid/ask across the primary book.</small>
        </article>
        <article className="mover-tile">
          <span>Liquidity</span>
          <strong>{compactCurrency(latest?.totalDepthThreePoints)}</strong>
          <small>Depth inside 3 probability points.</small>
        </article>
      </section>

      <div className="market-detail-grid">
        <section className="panel market-chart-panel" aria-labelledby="probability-history-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Probability</p>
              <h2 id="probability-history-heading">Primary-side history</h2>
            </div>
            <Radio size={17} aria-hidden="true" />
          </div>
          <ProbabilityChart snapshots={snapshots} />
        </section>

        <section className="panel" aria-labelledby="book-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Book</p>
              <h2 id="book-heading">Canonical orderbook</h2>
            </div>
            <Database size={17} aria-hidden="true" />
          </div>
          <div className="table-scroll">
            <table className="markets-table orderbook-table">
              <thead>
                <tr>
                  <th scope="col">Bid size</th>
                  <th scope="col">Bid probability</th>
                  <th scope="col">Ask probability</th>
                  <th scope="col">Ask size</th>
                </tr>
              </thead>
              <tbody>
                {latest && orderbookRows(latest.bids, latest.asks).length > 0 ? (
                  orderbookRows(latest.bids, latest.asks).map((row, index) => (
                    <tr key={`${row.bid?.price ?? "empty"}-${row.ask?.price ?? "empty"}-${index}`}>
                      <td>{row.bid?.size.toLocaleString("en-US") ?? "-"}</td>
                      <td className="metric-up">{formatProbability(row.bid?.price ?? null)}</td>
                      <td className="metric-down">{formatProbability(row.ask?.price ?? null)}</td>
                      <td>{row.ask?.size.toLocaleString("en-US") ?? "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>No book levels published.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="depth-grid" aria-label="Depth bands">
        {depthBands.map((band) => (
          <article className="depth-tile" key={band.label}>
            <div>
              <span>{band.label}</span>
              <strong>{fullCurrency(band.totalDepth)}</strong>
            </div>
            <dl>
              <div>
                <dt>Bid depth</dt>
                <dd>{fullCurrency(band.bidDepth)}</dd>
              </div>
              <div>
                <dt>Ask depth</dt>
                <dd>{fullCurrency(band.askDepth)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      <div className="market-secondary-grid">
        <LiveTape events={events} />

        <section className="panel local-alert-panel" aria-labelledby="market-alert-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Alerts</p>
              <h2 id="market-alert-heading">Local draft</h2>
            </div>
            <Bell size={17} aria-hidden="true" />
          </div>
          <div className="alert-draft">
            <label>
              Scope
              <select defaultValue="market">
                <option value="market">This market</option>
                <option value="watchlist">Watchlist</option>
              </select>
            </label>
            <label>
              Move threshold
              <input type="number" min="1" max="50" defaultValue="5" />
            </label>
            <label>
              Window
              <select defaultValue="900">
                <option value="300">5 minutes</option>
                <option value="900">15 minutes</option>
                <option value="1800">30 minutes</option>
              </select>
            </label>
            <button type="button" disabled>
              Telegram delivery disabled
            </button>
            <p>Draft only. No backend delivery is enabled for Telegram.</p>
          </div>
        </section>
      </div>

      <section className="panel debug-panel" aria-labelledby="debug-heading">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Builder</p>
            <h2 id="debug-heading">Outcome metadata</h2>
          </div>
          <SlidersHorizontal size={17} aria-hidden="true" />
        </div>
        <dl className="debug-grid">
          <div>
            <dt>Outcome ID</dt>
            <dd>{market.outcomeId}</dd>
          </div>
          <div>
            <dt>Side labels</dt>
            <dd>{market.sides.map((side) => side.label).join(" / ")}</dd>
          </div>
          <div>
            <dt>Encodings</dt>
            <dd>{market.sides.map((side) => side.encoding).join(" / ")}</dd>
          </div>
          <div>
            <dt>Spot coins</dt>
            <dd>{market.sides.map((side) => side.coin).join(" / ")}</dd>
          </div>
          <div>
            <dt>Token names</dt>
            <dd>{market.sides.map((side) => side.tokenName).join(" / ")}</dd>
          </div>
          <div>
            <dt>Asset IDs</dt>
            <dd>{market.sides.map((side) => side.assetId).join(" / ")}</dd>
          </div>
          <div>
            <dt>Quote token</dt>
            <dd>{market.quoteToken ?? "unknown"}</dd>
          </div>
          <div>
            <dt>Last book</dt>
            <dd>{formatTimestamp(latest?.lastBookUpdateAt)}</dd>
          </div>
        </dl>
        <details className="raw-metadata">
          <summary>
            <Info size={15} aria-hidden="true" />
            Raw metadata
          </summary>
          <pre>{rawMetadata(market.raw)}</pre>
        </details>
        <div className="debug-footer">
          <Clock size={15} aria-hidden="true" />
          Snapshot {formatTimestamp(latest?.timestamp)}
        </div>
      </section>
    </>
  );
}
