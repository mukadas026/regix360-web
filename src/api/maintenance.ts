import { client, throwError } from "./client";
import type { AssetStatus, Condition, MaintenancePriority, MaintenanceRecord, MaintenanceStatus, MaintenanceType } from "@/types/asset-platform";

export type MaintenanceFilters = {
  status?: MaintenanceStatus;
  type?: MaintenanceType;
  priority?: MaintenancePriority;
  assetId?: string;
  page?: number;
  pageSize?: number;
};

export type MaintenanceListResult = {
  maintenance: MaintenanceRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export const getMaintenanceRecords = {
  key: (filters: MaintenanceFilters = {}) => ["maintenance", filters] as const,
  fn: async (filters: MaintenanceFilters = {}): Promise<MaintenanceListResult> => {
    try {
      const res = await client.get<MaintenanceListResult>("/api/maintenance", { params: filters });
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};

export const getMaintenanceRecord = {
  key: (id: string) => ["maintenance-record", id] as const,
  fn: async (id: string): Promise<MaintenanceRecord> => {
    try {
      const res = await client.get<{ maintenance: MaintenanceRecord }>(`/api/maintenance/${id}`);
      return res.data.maintenance;
    } catch (error) {
      throwError(error);
    }
  },
};

export type AddMaintenanceInput = {
  assetId: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  scheduledAt: string;
  notes?: string;
};

export const addMaintenance = {
  fn: async (input: AddMaintenanceInput): Promise<MaintenanceRecord> => {
    try {
      const res = await client.post<{ maintenance: MaintenanceRecord }>("/api/maintenance", input);
      return res.data.maintenance;
    } catch (error) {
      throwError(error);
    }
  },
};

export const startMaintenance = {
  fn: async (id: string): Promise<MaintenanceRecord> => {
    try {
      const res = await client.post<{ maintenance: MaintenanceRecord }>(`/api/maintenance/${id}/start`);
      return res.data.maintenance;
    } catch (error) {
      throwError(error);
    }
  },
};

export type CompleteMaintenanceInput = {
  condition?: Condition;
  status?: AssetStatus;
  notes?: string;
};

export const completeMaintenance = {
  fn: async (id: string, input: CompleteMaintenanceInput = {}): Promise<MaintenanceRecord> => {
    try {
      const res = await client.post<{ maintenance: MaintenanceRecord }>(`/api/maintenance/${id}/complete`, input);
      return res.data.maintenance;
    } catch (error) {
      throwError(error);
    }
  },
};

export const cancelMaintenance = {
  fn: async (id: string): Promise<MaintenanceRecord> => {
    try {
      const res = await client.post<{ maintenance: MaintenanceRecord }>(`/api/maintenance/${id}/cancel`);
      return res.data.maintenance;
    } catch (error) {
      throwError(error);
    }
  },
};
