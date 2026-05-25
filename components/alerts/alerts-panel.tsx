"use client";

import { useMemo, useState } from "react";
import { BellOff, Clock, Plus, Radio, SlidersHorizontal } from "lucide-react";
import type { AlertPreset } from "@/lib/alerts/presets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function PanelHeader({
  eyebrow,
  title,
  headingId,
  icon,
}: {
  eyebrow: string;
  title: string;
  headingId: string;
  icon: React.ReactNode;
}) {
  return (
    <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border pb-3">
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-chart-info">
          {eyebrow}
        </p>
        <h2 id={headingId} className="m-0 text-[17px] font-semibold leading-[1.2]">
          {title}
        </h2>
      </div>
      <span className="text-muted-foreground">{icon}</span>
    </CardHeader>
  );
}

export function AlertsPanel({ presets }: AlertsPanelProps) {
  const [scope, setScope] = useState<LocalRule["scope"]>("watchlist");
  const [thresholdDraft, setThresholdDraft] = useState("5");
  const [windowSeconds, setWindowSeconds] = useState(900);
  const [rules, setRules] = useState<LocalRule[]>([]);
  const parsedThreshold = Number(thresholdDraft);
  const canAddRule = Number.isFinite(parsedThreshold) && parsedThreshold >= 1 && parsedThreshold <= 50;
  const rulePreview = useMemo(
    () => `${scope} / ${canAddRule ? parsedThreshold : "-"} point move / ${formatWindow(windowSeconds)}`,
    [canAddRule, parsedThreshold, scope, windowSeconds]
  );

  function addRule() {
    if (!canAddRule) return;

    setRules((currentRules) => [
      {
        id: `${Date.now()}-${currentRules.length}`,
        scope,
        threshold: parsedThreshold,
        windowSeconds
      },
      ...currentRules
    ]);
  }

  return (
    <>
      {/* Telegram status */}
      <Card className="mb-3.5" aria-labelledby="telegram-heading">
        <PanelHeader
          eyebrow="Delivery"
          title="Telegram connection"
          headingId="telegram-heading"
          icon={<BellOff size={17} aria-hidden="true" />}
        />
        <CardContent className="flex items-start justify-between gap-4 p-4">
          <div>
            <strong className="block text-sm font-bold text-foreground">Delivery unavailable</strong>
            <p className="m-0 mt-1 text-xs text-muted-foreground">
              Rules below stay local in this browser session. Telegram backend delivery is not enabled.
            </p>
          </div>
          <Button type="button" variant="outline" disabled className="shrink-0 cursor-not-allowed opacity-70">
            Connect disabled
          </Button>
        </CardContent>
      </Card>

      {/* Preset grid */}
      <section
        className="mb-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3"
        aria-label="Alert presets"
      >
        {presets.map((preset) => (
          <article
            key={preset.id}
            className="min-w-0 rounded-md border border-border bg-[#0d1219] p-3"
          >
            <span className="block overflow-hidden text-[13px] font-bold text-foreground/80 text-ellipsis whitespace-nowrap">
              {preset.label}
            </span>
            <strong className="mt-2 block text-[22px] font-bold text-chart-positive">
              {formatPresetThreshold(preset)}
            </strong>
            <small className="mt-1 line-clamp-2 block min-h-8 text-xs leading-[1.35] text-muted-foreground">
              {typeLabel(preset.type)} / {preset.scope} / {formatWindow(preset.windowSeconds)}
            </small>
          </article>
        ))}
      </section>

      {/* Rule builder + local list */}
      <div className="grid items-start gap-3.5 md:grid-cols-[minmax(420px,1fr)_minmax(320px,0.72fr)]">
        <Card aria-labelledby="draft-heading">
          <PanelHeader
            eyebrow="Builder"
            title="Draft rule"
            headingId="draft-heading"
            icon={<SlidersHorizontal size={17} aria-hidden="true" />}
          />
          <CardContent className="grid gap-3 p-4">
            <div className="grid gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Scope
              </label>
              <Select value={scope} onValueChange={(value) => setScope(value as LocalRule["scope"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All markets</SelectItem>
                  <SelectItem value="watchlist">Watchlist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Threshold
              </label>
              <Input
                type="number"
                min="1"
                max="50"
                value={thresholdDraft}
                onChange={(event) => setThresholdDraft(event.target.value)}
                aria-invalid={!canAddRule}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Window
              </label>
              <Select
                value={String(windowSeconds)}
                onValueChange={(value) => setWindowSeconds(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="900">15 minutes</SelectItem>
                  <SelectItem value="1800">30 minutes</SelectItem>
                  <SelectItem value="3600">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <Radio size={15} aria-hidden="true" />
              <span>{rulePreview}</span>
            </div>
            <Button type="button" onClick={addRule} disabled={!canAddRule}>
              <Plus size={16} aria-hidden="true" />
              Add local rule
            </Button>
            <p className="m-0 text-xs text-muted-foreground">
              Draft state is local only. Telegram delivery remains disabled.
            </p>
          </CardContent>
        </Card>

        <Card aria-labelledby="rules-heading">
          <PanelHeader
            eyebrow="Rules"
            title="Local list"
            headingId="rules-heading"
            icon={<Clock size={17} aria-hidden="true" />}
          />
          <CardContent className="p-0">
            {rules.length === 0 ? (
              <div className="px-4 py-6 text-muted-foreground">
                <p className="m-0 text-sm font-bold text-foreground">No local rules drafted.</p>
                <span className="mt-1 block text-xs leading-relaxed">
                  Add a rule to stage probability move monitoring in this session.
                </span>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {rules.map((rule) => (
                  <li key={rule.id} className="px-4 py-3">
                    <strong className="block text-sm font-bold text-foreground">
                      {rule.threshold} point move
                    </strong>
                    <span className="block text-xs text-muted-foreground">
                      {rule.scope} / {formatWindow(rule.windowSeconds)}
                    </span>
                    <Badge variant="outline" className="mt-1 border-border text-[10px] text-muted-foreground">
                      Telegram disabled
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
