import { supabase } from "@/lib/supabase-client";
import { client, throwError } from "./client";
import type {
  AssetDetail,
  AssetGroup,
  AssetImage,
  AssetStatus,
  AssetTransferSnapshot,
  AssetUnit,
  Condition,
  ConditionHistoryEntry,
  CreateAssetSummary,
  PublicAsset,
} from "@/types/asset-platform";

const ASSET_IMAGES_BUCKET = "asset-images";
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "heic"];

function extOf(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

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

// Preferred: { batchId }. Legacy (deprecated, kept for old links): the
// four-part tuple — matches every batch with that description/category/
// location/department, which is ambiguous once an org has bought the
// same item twice.
export type AssetUnitsQuery =
  | { batchId: string }
  | { description: string; categoryItemId: string; locationId: string; departmentId: string };

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
  imagePath?: string | null;
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

// Step 1+2 of attaching a photo to a batch that doesn't exist yet: mint a
// signed staging target, PUT the bytes straight to Storage, hand back the
// path — the caller passes it as `imagePath` on addAsset.fn.
export const uploadBatchImage = {
  fn: async (file: File): Promise<string> => {
    const ext = extOf(file);
    if (!IMAGE_EXTENSIONS.includes(ext)) {
      throw { name: "ApiError", message: "Image must be a PNG, JPG, WEBP, or HEIC." };
    }

    let upload: { path: string; token: string; signedUrl: string };
    try {
      const res = await client.post<{ path: string; token: string; signedUrl: string }>(
        "/api/assets/batch-image",
        { ext },
      );
      upload = res.data;
    } catch (error) {
      throwError(error);
    }

    const { error } = await supabase.storage.from(ASSET_IMAGES_BUCKET).uploadToSignedUrl(upload.path, upload.token, file);
    if (error) throw { name: "ApiError", message: error.message ?? "The photo upload failed. Try again." };

    return upload.path;
  },
};

// Replace or clear an existing batch's photo (the ONE shared "what did we
// buy" shot, distinct from a unit's own gallery). Mint+upload via
// uploadBatchImage.fn first, then pass the returned path here — or pass
// `null` to clear the existing photo.
export const updateBatchImage = {
  fn: async (batchId: string, path: string | null): Promise<{ batchId: string; imageUrl: string | null }> => {
    try {
      const res = await client.put<{ batchId: string; imageUrl: string | null }>(
        `/api/assets/batches/${batchId}/image`,
        { path },
      );
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};

// Per-unit gallery: mint + upload + confirm in one call, matching the
// direct-to-Storage pattern used everywhere else in this API.
export const uploadUnitImage = {
  fn: async (assetId: string, file: File): Promise<AssetImage> => {
    const ext = extOf(file);
    if (!IMAGE_EXTENSIONS.includes(ext)) {
      throw { name: "ApiError", message: "Image must be a PNG, JPG, WEBP, or HEIC." };
    }

    let upload: { path: string; token: string; signedUrl: string };
    try {
      const res = await client.post<{ path: string; token: string; signedUrl: string }>(
        `/api/assets/${assetId}/images`,
        { ext },
      );
      upload = res.data;
    } catch (error) {
      throwError(error);
    }

    const { error } = await supabase.storage.from(ASSET_IMAGES_BUCKET).uploadToSignedUrl(upload.path, upload.token, file);
    if (error) throw { name: "ApiError", message: error.message ?? "The photo upload failed. Try again." };

    try {
      const res = await client.put<{ image: AssetImage }>(`/api/assets/${assetId}/images`, { path: upload.path });
      return res.data.image;
    } catch (confirmError) {
      throwError(confirmError);
    }
  },
};

export const deleteUnitImage = {
  fn: async (assetId: string, imageId: string): Promise<{ deleted: true }> => {
    try {
      const res = await client.delete<{ deleted: true }>(`/api/assets/${assetId}/images/${imageId}`);
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

// Public QR-scan lookup — no auth required, minimal safe field subset.
export const getPublicAsset = {
  key: (id: string) => ["public-asset", id] as const,
  fn: async (id: string): Promise<PublicAsset> => {
    try {
      const res = await client.get<PublicAsset>(`/api/public/assets/${id}`);
      return res.data;
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
