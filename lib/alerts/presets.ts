export type AlertPreset = {
  id: string;
  label: string;
  type: "probability_delta" | "expiry_soon" | "new_market" | "spread_below";
  threshold: number;
  windowSeconds?: number;
  scope: "all" | "watchlist";
};

export const alertPresets: AlertPreset[] = [
  {
    id: "big-move",
    label: "Big move",
    type: "probability_delta",
    threshold: 5,
    windowSeconds: 15 * 60,
    scope: "all"
  },
  {
    id: "violent-move",
    label: "Violent move",
    type: "probability_delta",
    threshold: 10,
    windowSeconds: 15 * 60,
    scope: "all"
  },
  {
    id: "expiry-soon",
    label: "Expiry soon",
    type: "expiry_soon",
    threshold: 30,
    windowSeconds: 30 * 60,
    scope: "watchlist"
  },
  {
    id: "new-market",
    label: "New market",
    type: "new_market",
    threshold: 1,
    scope: "all"
  },
  {
    id: "tight-book",
    label: "Tight book",
    type: "spread_below",
    threshold: 1,
    scope: "all"
  }
];
