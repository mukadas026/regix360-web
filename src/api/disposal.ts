import { client, throwError } from "./client";
import type { DisposalMethod, DisposalRecord, DisposalStatus } from "@/types/asset-platform";

export type DisposalFilters = {
  status?: DisposalStatus;
  method?: DisposalMethod;
  assetId?: string;
  page?: number;
  pageSize?: number;
};

export type DisposalListResponse = {
  disposals: DisposalRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export const getDisposalRecords = {
  key: (filters: DisposalFilters = {}) => ["disposalRecords", filters] as const,
  fn: async (filters: DisposalFilters = {}) => {
    try {
      const res = await client.get<DisposalListResponse>("/api/disposal", {
        params: {
          status: filters.status,
          method: filters.method,
          assetId: filters.assetId,
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

export const getDisposalRecord = {
  key: (id: string) => ["disposalRecord", id] as const,
  fn: async (id: string) => {
    try {
      const res = await client.get<{ disposal: DisposalRecord }>(`/api/disposal/${id}`);
      return res.data.disposal;
    } catch (error) {
      throwError(error);
    }
  },
};

export type RequestDisposalInput = {
  assetId: string;
  method: DisposalMethod;
  proceeds?: number | null;
  reason?: string | null;
};

export const requestDisposal = {
  fn: async (input: RequestDisposalInput) => {
    try {
      const res = await client.post<{ disposal: DisposalRecord }>("/api/disposal", input);
      return res.data.disposal;
    } catch (error) {
      throwError(error);
    }
  },
};

export const approveDisposal = {
  fn: async (id: string) => {
    try {
      const res = await client.post<{ disposal: DisposalRecord }>(`/api/disposal/${id}/approve`);
      return res.data.disposal;
    } catch (error) {
      throwError(error);
    }
  },
};

export const completeDisposal = {
  fn: async (id: string) => {
    try {
      const res = await client.post<{ disposal: DisposalRecord }>(`/api/disposal/${id}/complete`);
      return res.data.disposal;
    } catch (error) {
      throwError(error);
    }
  },
};

export const cancelDisposal = {
  fn: async (id: string) => {
    try {
      const res = await client.post<{ disposal: DisposalRecord }>(`/api/disposal/${id}/cancel`);
      return res.data.disposal;
    } catch (error) {
      throwError(error);
    }
  },
};
