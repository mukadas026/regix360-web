import { client, throwError } from "./client";
import type {
  AssetDetail,
  AssetGroup,
  AssetStatus,
  AssetTransferSnapshot,
  AssetUnit,
  Condition,
  ConditionHistoryEntry,
  CreateAssetSummary,
} from "@/types/asset-platform";

export type AssetSort = "updated" | "code" | "description" | "qty";

export type AssetFilters = {
  search?: string;
  locationIds?: string[];
  departmentIds?: string[];
  categoryIds?: string[];
  conditions?: Condition[];
  sort?: AssetSort;
  page?: number;
  pageSize?: number;
};

export type AssetsResponse = {
  groups: AssetGroup[];
  filteredGroups: number;
  filteredUnits: number;
  totalUnits: number;
  page: number;
  pageSize: number;
};

export const getAssets = {
  key: (filters: AssetFilters = {}) => ["assets", filters] as const,
  fn: async (filters: AssetFilters = {}) => {
    try {
      const res = await client.get<AssetsResponse>("/api/assets", {
        params: {
          search: filters.search || undefined,
          locationIds: filters.locationIds?.length ? filters.locationIds.join(",") : undefined,
          departmentIds: filters.departmentIds?.length ? filters.departmentIds.join(",") : undefined,
          categoryIds: filters.categoryIds?.length ? filters.categoryIds.join(",") : undefined,
          conditions: filters.conditions?.length ? filters.conditions.join(",") : undefined,
          sort: filters.sort,
          page: filters.page,
          pageSize: filters.pageSize,
        },
      });
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};

export type AssetUnitsQuery = {
  description: string;
  categoryItemId: string;
  locationId: string;
  departmentId: string;
};

export const getAssetUnits = {
  key: (query: AssetUnitsQuery) => ["asset-units", query] as const,
  fn: async (query: AssetUnitsQuery) => {
    try {
      const res = await client.get<{ units: AssetUnit[] }>("/api/assets/units", { params: query });
      return res.data.units;
    } catch (error) {
      throwError(error);
    }
  },
};

export type AddAssetInput = {
  description: string;
  categoryItemId: string;
  locationId: string;
  departmentId: string;
  good: number;
  fair: number;
  bad: number;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  supplier?: string | null;
  acquisitionMethod: "purchase" | "donation" | "transfer" | "other";
  acquisitionDate?: string | null;
  acquisitionCost?: number | null;
  customCode?: string | null;
  notes?: string | null;
};

export const addAsset = {
  fn: async (input: AddAssetInput) => {
    try {
      const res = await client.post<CreateAssetSummary>("/api/assets", input);
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};

type AssetDetailResponse = {
  asset: Omit<AssetDetail, "history" | "transfers">;
  history: ConditionHistoryEntry[];
  transfers: AssetTransferSnapshot[];
};

export const getAsset = {
  key: (id: string) => ["asset", id] as const,
  fn: async (id: string): Promise<AssetDetail> => {
    try {
      const res = await client.get<AssetDetailResponse>(`/api/assets/${id}`);
      return { ...res.data.asset, history: res.data.history, transfers: res.data.transfers };
    } catch (error) {
      throwError(error);
    }
  },
};

export type UpdateAssetInput = Partial<{
  description: string;
  condition: Condition;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  supplier: string | null;
  acquisitionMethod: "purchase" | "donation" | "transfer" | "other";
  acquisitionDate: string | null;
  acquisitionCost: number | null;
  status: AssetStatus;
  custodianId: string | null;
  customCode: string | null;
  notes: string | null;
}>;

export type UpdateAssetResult = {
  id: string;
  description: string;
  code: string;
  condition: Condition;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  supplier: string | null;
  acquisition_method: "purchase" | "donation" | "transfer" | "other";
  acquisition_date: string | null;
  acquisition_cost: number | null;
  status: AssetStatus;
  custodian_id: string | null;
  updated_at: string;
};

export const updateAsset = {
  fn: async (id: string, input: UpdateAssetInput) => {
    try {
      const res = await client.patch<{ asset: UpdateAssetResult }>(`/api/assets/${id}`, input);
      return res.data.asset;
    } catch (error) {
      throwError(error);
    }
  },
};
