"use client";

import { useMemo, useState } from "react";
import { BellOff, Clock, Plus, Radio, SlidersHorizontal } from "lucide-react";
import type { AlertPreset } from "@/lib/alerts/presets";

type AlertsPanelProps = {
  presets: AlertPreset[];
};

type LocalRule = {
  id: string;
  scope: "all" | "watchlist";
  threshold: number;
  windowSeconds: number;
};

function formatPresetThreshold(preset: AlertPreset): string {
  if (preset.type === "spread_below") return `< ${preset.threshold} pt spread`;
  if (preset.type === "expiry_soon") return `${preset.threshold} min expiry`;
  if (preset.type === "new_market") return "New market";
  return `${preset.threshold} pt move`;
}

function formatWindow(seconds: number | undefined): string {
  if (!seconds) return "Any window";
  const minutes = seconds / 60;
  return minutes >= 60 ? `${minutes / 60}h window` : `${minutes}m window`;
}

function typeLabel(type: AlertPreset["type"]): string {
  return type.replaceAll("_", " ");
}

export function AlertsPanel({ presets }: AlertsPanelProps) {
  const [scope, setScope] = useState<LocalRule["scope"]>("watchlist");
  const [threshold, setThreshold] = useState(5);
  const [windowSeconds, setWindowSeconds] = useState(900);
  const [rules, setRules] = useState<LocalRule[]>([]);
  const rulePreview = useMemo(
    () => `${scope} / ${threshold} point move / ${formatWindow(windowSeconds)}`,
    [scope, threshold, windowSeconds]
  );

  function addRule() {
    setRules((currentRules) => [
      {
        id: `${Date.now()}-${currentRules.length}`,
        scope,
        threshold,
        windowSeconds
      },
      ...currentRules
    ]);
  }

  return (
    <>
      <section className="command-header" aria-labelledby="alerts-heading">
        <div>
          <p className="eyebrow">Alerts</p>
          <h1 id="alerts-heading">Local alert drafts</h1>
        </div>
        <span className="source-marker">Telegram disabled</span>
      </section>

      <section className="panel telegram-panel" aria-labelledby="telegram-heading">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Delivery</p>
            <h2 id="telegram-heading">Telegram connection</h2>
          </div>
          <BellOff size={17} aria-hidden="true" />
        </div>
        <div className="telegram-disabled">
          <div>
            <strong>Delivery unavailable</strong>
            <p>Rules below stay local in this browser session. Telegram backend delivery is not enabled.</p>
          </div>
          <button type="button" disabled>
            Connect disabled
          </button>
        </div>
      </section>

      <section className="alert-grid" aria-label="Alert presets">
        {presets.map((preset) => (
          <article className="mover-tile" key={preset.id}>
            <span>{preset.label}</span>
            <strong>{formatPresetThreshold(preset)}</strong>
            <small>{typeLabel(preset.type)} / {preset.scope} / {formatWindow(preset.windowSeconds)}</small>
          </article>
        ))}
      </section>

      <div className="alerts-workspace">
        <section className="panel" aria-labelledby="draft-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Builder</p>
              <h2 id="draft-heading">Draft rule</h2>
            </div>
            <SlidersHorizontal size={17} aria-hidden="true" />
          </div>
          <div className="alert-draft">
            <label>
              Scope
              <select value={scope} onChange={(event) => setScope(event.target.value as LocalRule["scope"])}>
                <option value="all">All markets</option>
                <option value="watchlist">Watchlist</option>
              </select>
            </label>
            <label>
              Threshold
              <input
                type="number"
                min="1"
                max="50"
                value={threshold}
                onChange={(event) => setThreshold(Number(event.target.value))}
              />
            </label>
            <label>
              Window
              <select value={windowSeconds} onChange={(event) => setWindowSeconds(Number(event.target.value))}>
                <option value="300">5 minutes</option>
                <option value="900">15 minutes</option>
                <option value="1800">30 minutes</option>
                <option value="3600">60 minutes</option>
              </select>
            </label>
            <div className="draft-preview">
              <Radio size={15} aria-hidden="true" />
              <span>{rulePreview}</span>
            </div>
            <button type="button" onClick={addRule}>
              <Plus size={16} aria-hidden="true" />
              Add local rule
            </button>
            <p>Draft state is local only. Telegram delivery remains disabled.</p>
          </div>
        </section>

        <section className="panel" aria-labelledby="rules-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Rules</p>
              <h2 id="rules-heading">Local list</h2>
            </div>
            <Clock size={17} aria-hidden="true" />
          </div>
          {rules.length === 0 ? (
            <div className="empty-state">
              <p>No local rules drafted.</p>
              <span>Add a rule to stage probability move monitoring in this session.</span>
            </div>
          ) : (
            <ul className="rules-list">
              {rules.map((rule) => (
                <li key={rule.id}>
                  <strong>{rule.threshold} point move</strong>
                  <span>{rule.scope} / {formatWindow(rule.windowSeconds)}</span>
                  <small>Telegram disabled</small>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
