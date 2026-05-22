import { AlertsPanel } from "@/components/alerts/alerts-panel";
import { AppShell } from "@/components/layout/app-shell";
import { alertPresets } from "@/lib/alerts/presets";

export default function AlertsPage() {
  return (
    <AppShell>
      <AlertsPanel presets={alertPresets} />
    </AppShell>
  );
}
