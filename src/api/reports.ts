import { mockAssets, mockLocations } from "@/lib/mock-data";
import { delay } from "./mock";

export const reportDefinitions = [
  { key: "register", icon: "📋", title: "Asset register", desc: "Full list, filterable — the canonical export." },
  { key: "condition-location", icon: "📍", title: "Condition by location", desc: "Good/fair/bad split for every location." },
  { key: "condition-category", icon: "🗂", title: "Condition by category", desc: "Good/fair/bad split for every category." },
  { key: "verification", icon: "✓", title: "Verification report", desc: "Pick a past cycle and view its diff." },
];

export const getConditionByLocation = {
  key: ["conditionByLocation"] as const,
  fn: async () => {
    const rows = mockLocations.map((loc) => {
      const assets = mockAssets.filter((a) => a.locationId === loc.id);
      return {
        name: loc.name,
        g: assets.reduce((s, a) => s + a.good, 0),
        f: assets.reduce((s, a) => s + a.fair, 0),
        b: assets.reduce((s, a) => s + a.bad, 0),
      };
    });
    return delay(rows);
  },
};
