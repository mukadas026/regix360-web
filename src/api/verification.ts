import axios from "axios";
import { client, throwError } from "./client";
import type { Condition, VerificationCycle, VerificationCycleStatus, VerificationReportRow, VerificationScopeAsset } from "@/types/asset-platform";

// The backend's error envelope is `{ error: "message string", ...extra }`
// (src/shared/errors.js errorHandler) — flat, not the nested
// `{ error: { message, details } }` shape src/api/client.ts's throwError
// assumes. That mismatch would swallow the real backend message (and the
// `cycleId` extra field the 409-already-in-progress response carries), so
// this file parses the response body itself instead of relying on it.
export type VerificationApiError = {
  name: "ApiError";
  message: string;
  cycleId?: string;
};

function throwVerificationError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; cycleId?: string } | undefined;
    throw {
      name: "ApiError",
      message: data?.error ?? error.message ?? "Something went wrong.",
      cycleId: data?.cycleId,
    } satisfies VerificationApiError;
  }
  throwError(error);
}

export const getVerificationCycles = {
  key: ["verificationCycles"] as const,
  fn: async (): Promise<VerificationCycle[]> => {
    try {
      const res = await client.get<{ cycles: VerificationCycle[] }>("/api/verification");
      return res.data.cycles;
    } catch (error) {
      throwVerificationError(error);
    }
  },
};

export type StartVerificationInput = {
  locationIds?: string[];
};

export type StartedVerificationCycle = {
  id: string;
  status: VerificationCycleStatus;
  started_at: string;
  locationIds: string[];
};

export const startVerification = {
  fn: async (input: StartVerificationInput = {}): Promise<StartedVerificationCycle> => {
    try {
      const res = await client.post<{ cycle: StartedVerificationCycle }>("/api/verification", input);
      return res.data.cycle;
    } catch (error) {
      throwVerificationError(error);
    }
  },
};

export type ActiveVerificationLocation = {
  id: string;
  name: string;
  code: string;
  in_scope: number;
  counted: number;
};

export type ActiveVerification = {
  cycle: {
    id: string;
    status: "in_progress";
    started_at: string;
    started_by_name: string;
  };
  progress: { in_scope: number; counted: number };
  locations: ActiveVerificationLocation[];
};

export const getActiveVerification = {
  key: ["verification", "active"] as const,
  fn: async (): Promise<ActiveVerification | null> => {
    try {
      const res = await client.get<{ active: ActiveVerification | null }>("/api/verification/active");
      return res.data.active;
    } catch (error) {
      throwVerificationError(error);
    }
  },
};

export type VerificationScopeFilters = {
  locationId?: string;
  counted?: boolean;
};

export const getVerificationScopeAssets = {
  key: (cycleId: string, filters: VerificationScopeFilters = {}) => ["verification", cycleId, "assets", filters] as const,
  fn: async (cycleId: string, filters: VerificationScopeFilters = {}): Promise<VerificationScopeAsset[]> => {
    try {
      const res = await client.get<{ assets: VerificationScopeAsset[] }>(`/api/verification/${cycleId}/assets`, {
        params: {
          locationId: filters.locationId || undefined,
          counted: filters.counted === undefined ? undefined : String(filters.counted),
        },
      });
      return res.data.assets;
    } catch (error) {
      throwVerificationError(error);
    }
  },
};

export type RecordCountInput = {
  cycleId: string;
  assetId: string;
  found?: boolean;
  condition?: Condition;
};

export type RecordCountResult = {
  count: VerificationScopeAsset;
  discrepancy: boolean;
};

export const recordCount = {
  fn: async ({ cycleId, assetId, found, condition }: RecordCountInput): Promise<RecordCountResult> => {
    try {
      const res = await client.post<RecordCountResult>(`/api/verification/${cycleId}/counts`, {
        assetId,
        found,
        condition,
      });
      return res.data;
    } catch (error) {
      throwVerificationError(error);
    }
  },
};

export type VerificationCompleteSummary = {
  in_scope: number;
  counted: number;
  discrepancies: number;
  reported_missing: number;
  uncounted: number;
  assetsUpdated: number;
};

export const completeVerification = {
  fn: async (cycleId: string): Promise<VerificationCompleteSummary> => {
    try {
      const res = await client.post<{ summary: VerificationCompleteSummary }>(`/api/verification/${cycleId}/complete`);
      return res.data.summary;
    } catch (error) {
      throwVerificationError(error);
    }
  },
};

export const abandonVerification = {
  fn: async (cycleId: string): Promise<{ ok: true }> => {
    try {
      const res = await client.post<{ ok: true }>(`/api/verification/${cycleId}/abandon`);
      return res.data;
    } catch (error) {
      throwVerificationError(error);
    }
  },
};

export type VerificationReport = {
  cycle: {
    id: string;
    status: VerificationCycleStatus;
    started_at: string;
    completed_at: string | null;
    started_by_name: string;
  };
  counts: VerificationReportRow[];
  uncounted: { description: string; code: string; location_name: string }[];
};

export const getVerificationReport = {
  key: (cycleId: string) => ["verification", cycleId, "report"] as const,
  fn: async (cycleId: string): Promise<VerificationReport> => {
    try {
      const res = await client.get<VerificationReport>(`/api/verification/${cycleId}/report`);
      return res.data;
    } catch (error) {
      throwVerificationError(error);
    }
  },
};
