import { mockAssets, mockLocations } from "@/lib/mock-data";
import { delay } from "./mock";

export const getDashboard = {
  key: ["dashboard"] as const,
  fn: async () => {
    const totals = mockAssets.reduce(
      (acc, a) => {
        acc.good += a.good;
        acc.fair += a.fair;
        acc.bad += a.bad;
        return acc;
      },
      { good: 0, fair: 0, bad: 0 },
    );
    const totalAssets = totals.good + totals.fair + totals.bad;

    const byLocation = mockLocations
      .map((loc) => ({
        name: loc.name,
        count: mockAssets
          .filter((a) => a.locationId === loc.id)
          .reduce((sum, a) => sum + a.good + a.fair + a.bad, 0),
      }))
      .sort((a, b) => b.count - a.count);
    const maxCount = byLocation[0]?.count || 1;

    const attention = mockLocations
      .map((loc) => {
        const bad = mockAssets
          .filter((a) => a.locationId === loc.id)
          .reduce((sum, a) => sum + a.bad, 0);
        return { locName: loc.name, count: bad, detail: `${bad} units in bad condition` };
      })
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const activity = [
      { icon: "↑", text: "412 assets uploaded to Agbogba", when: "2 hours ago" },
      { icon: "✓", text: "Verification completed for East Legon", when: "Yesterday" },
      { icon: "✎", text: "Ceiling fan CFAN/0042 condition updated", when: "2 days ago" },
      { icon: "+", text: "Spintex location added", when: "1 week ago" },
    ];

    const byCategory = Array.from(new Set(mockAssets.map((a) => a.category))).map((category) => ({
      category,
      count: mockAssets
        .filter((a) => a.category === category)
        .reduce((sum, a) => sum + a.good + a.fair + a.bad, 0),
    }));

    return delay({
      kpi: { assets: totalAssets, locations: mockLocations.length, ...totals },
      byLocation: byLocation.map((l) => ({ ...l, pct: `${Math.round((l.count / maxCount) * 100)}%` })),
      byCategory,
      attention,
      activity,
    });
  },
};
