import { client, throwError } from "./client";
import type { ActivityLogEntry } from "@/types/asset-platform";

export type DashboardTotals = {
  assetLines: number;
  unitsGood: number;
  unitsFair: number;
  unitsBad: number;
  unitsTotal: number;
  locations: number;
};

export type DashboardNeedsAttention = {
  location_id: string;
  location_name: string;
  bad_count: number;
};

export type DashboardUnitsByCategory = {
  category: string;
  unit_count: number;
};

export type DashboardLastImport = {
  id: string;
  file_name: string;
  imported_count: number;
  completed_at: string;
};

export type DashboardActiveVerification = {
  id: string;
  started_at: string;
  counted: number;
  in_scope: number;
};

export type DashboardLastVerification = {
  id: string;
  completed_at: string;
  completed_by_name: string;
  discrepancies: number;
};

export type DashboardByLocation = {
  id: string;
  name: string;
  asset_lines: number;
};

export type Dashboard = {
  totals: DashboardTotals;
  needsAttention: DashboardNeedsAttention[];
  unitsByCategory: DashboardUnitsByCategory[];
  lastImport: DashboardLastImport | null;
  activeVerification: DashboardActiveVerification | null;
  lastVerification: DashboardLastVerification | null;
  byLocation: DashboardByLocation[];
  recentActivity: ActivityLogEntry[];
};

export const getDashboard = {
  key: ["dashboard"] as const,
  fn: async (): Promise<Dashboard> => {
    try {
      const res = await client.get<Dashboard>("/api/dashboard");
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};
