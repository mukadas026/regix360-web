import { client, throwError } from "./client";
import type { Transfer, TransferStatus } from "@/types/asset-platform";

export type TransferFilters = {
  status?: TransferStatus;
  assetId?: string;
  locationId?: string;
  page?: number;
  pageSize?: number;
};

export type TransferListResult = {
  transfers: Transfer[];
  total: number;
  page: number;
  pageSize: number;
};

export const getTransfers = {
  key: (filters: TransferFilters = {}) => ["transfers", filters] as const,
  fn: async (filters: TransferFilters = {}): Promise<TransferListResult> => {
    try {
      const res = await client.get<TransferListResult>("/api/transfers", { params: filters });
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};

export const getTransfer = {
  key: (id: string) => ["transfer", id] as const,
  fn: async (id: string): Promise<Transfer> => {
    try {
      const res = await client.get<{ transfer: Transfer }>(`/api/transfers/${id}`);
      return res.data.transfer;
    } catch (error) {
      throwError(error);
    }
  },
};

export type InitiateTransferInput = {
  assetId: string;
  toLocationId: string;
  toDepartmentId: string;
  toCustodianId?: string | null;
  reason?: string;
};

export const initiateTransfer = {
  fn: async (input: InitiateTransferInput): Promise<Transfer> => {
    try {
      const res = await client.post<{ transfer: Transfer }>("/api/transfers", input);
      return res.data.transfer;
    } catch (error) {
      throwError(error);
    }
  },
};

export const completeTransfer = {
  fn: async (id: string): Promise<Transfer> => {
    try {
      const res = await client.post<{ transfer: Transfer }>(`/api/transfers/${id}/complete`);
      return res.data.transfer;
    } catch (error) {
      throwError(error);
    }
  },
};

export const cancelTransfer = {
  fn: async (id: string): Promise<Transfer> => {
    try {
      const res = await client.post<{ transfer: Transfer }>(`/api/transfers/${id}/cancel`);
      return res.data.transfer;
    } catch (error) {
      throwError(error);
    }
  },
};
