import { mockAssets, mockCategoryDictionary, mockLocations } from "@/lib/mock-data";
import type { Asset } from "@/types/asset-platform";
import { delay } from "./mock";

export type AssetFilters = {
  search?: string;
  locationId?: string;
  category?: string;
  condition?: "good" | "fair" | "bad";
};

function matchesFilters(asset: Asset, filters: AssetFilters) {
  if (filters.search) {
    const q = filters.search.toLowerCase();
    if (!asset.description.toLowerCase().includes(q) && !asset.code.toLowerCase().includes(q)) return false;
  }
  if (filters.locationId && asset.locationId !== filters.locationId) return false;
  if (filters.category && asset.category !== filters.category) return false;
  if (filters.condition) {
    const dominant = (["good", "fair", "bad"] as const).reduce((a, b) => (asset[b] > asset[a] ? b : a), "good");
    if (dominant !== filters.condition) return false;
  }
  return true;
}

export const getAssets = {
  key: (filters: AssetFilters) => ["assets", filters] as const,
  fn: async (filters: AssetFilters = {}) => {
    const rows = mockAssets.filter((asset) => matchesFilters(asset, filters));
    return delay({ rows, total: mockAssets.length, filteredTotal: rows.length });
  },
};

export const getAsset = {
  key: (id: string) => ["asset", id] as const,
  fn: async (id: string) => {
    const asset = mockAssets.find((a) => a.id === id) ?? null;
    return delay(asset);
  },
};

export const getCategoryDictionary = {
  key: ["categoryDictionary"] as const,
  fn: async () => delay(mockCategoryDictionary),
};

export type AddAssetInput = {
  description: string;
  locationId: string;
  good: number;
  fair: number;
  bad: number;
  makeModel: string | null;
  supplier: string | null;
};

export const addAsset = {
  fn: async (input: AddAssetInput) => {
    const location = mockLocations.find((l) => l.id === input.locationId);
    const match = mockCategoryDictionary.find((c) =>
      input.description.toLowerCase().includes(c.itemCode.toLowerCase()),
    );
    const serial = String(mockAssets.length + 1).padStart(4, "0");
    const code = `CFCC/${location?.name.slice(0, 3).toUpperCase() ?? "ORG"}/${match?.itemCode ?? "ITEM"}/${serial}`;
    const asset: Asset = {
      id: `asset-${mockAssets.length + 1}`,
      code,
      description: input.description,
      locationId: input.locationId,
      locationName: location?.name ?? "",
      category: match?.category ?? "Uncategorized",
      good: input.good,
      fair: input.fair,
      bad: input.bad,
      makeModel: input.makeModel,
      supplier: input.supplier,
      updatedAt: "Just now",
      history: [],
    };
    mockAssets.unshift(asset);
    if (location) location.assetCount += 1;
    return delay(asset);
  },
};
