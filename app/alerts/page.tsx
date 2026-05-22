import { Bell } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { alertPresets } from "@/lib/alerts/presets";

export default function AlertsPage() {
  return (
    <AppShell>
      <section className="command-header" aria-labelledby="alerts-heading">
        <div>
          <p className="eyebrow">Alerts</p>
          <h1 id="alerts-heading">Local alert drafts</h1>
        </div>
        <span className="source-marker">Telegram disabled</span>
      </section>

      <section className="panel" aria-labelledby="telegram-heading">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Delivery</p>
            <h2 id="telegram-heading">Telegram connection</h2>
          </div>
          <Bell size={17} aria-hidden="true" />
        </div>

        <div className="empty-state">
          <p>Backend delivery is disabled.</p>
          <span>Draft alert rules locally while market data and tape generation stay fixture-backed.</span>
        </div>
      </section>

      <section className="alert-grid" aria-label="Alert presets">
        {alertPresets.map((preset) => (
          <article className="mover-tile" key={preset.id}>
            <span>{preset.label}</span>
            <strong>{preset.threshold}</strong>
            <small>{preset.type.replaceAll("_", " ")} / {preset.scope}</small>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
