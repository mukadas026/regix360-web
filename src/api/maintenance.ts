import { mockAssets, mockMaintenanceRecords } from "@/lib/mock-data";
import type { MaintenancePriority, MaintenanceRecord, MaintenanceType } from "@/types/asset-platform";
import { delay } from "./mock";

export const getMaintenanceRecords = {
  key: ["maintenanceRecords"] as const,
  fn: async () => delay(mockMaintenanceRecords),
};

export type AddMaintenanceInput = {
  assetId: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  description: string;
  scheduledDate: string;
  estimatedHours: number | null;
};

export const addMaintenance = {
  fn: async (input: AddMaintenanceInput) => {
    const asset = mockAssets.find((a) => a.id === input.assetId);
    if (!asset) throw { name: "ApiError", message: "Select an asset." };

    const record: MaintenanceRecord = {
      id: `maint-${mockMaintenanceRecords.length + 1}`,
      code: `MNT-${String(mockMaintenanceRecords.length + 1).padStart(4, "0")}`,
      assetId: asset.id,
      assetDescription: asset.description,
      assetCode: asset.code,
      type: input.type,
      priority: input.priority,
      description: input.description,
      scheduledDate: input.scheduledDate,
      estimatedHours: input.estimatedHours,
      status: "scheduled",
    };
    mockMaintenanceRecords.unshift(record);
    return delay(record);
  },
};
