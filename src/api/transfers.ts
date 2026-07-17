import { mockAssets, mockLocations, mockTransfers } from "@/lib/mock-data";
import type { Transfer } from "@/types/asset-platform";
import { delay } from "./mock";

export const getTransfers = {
  key: ["transfers"] as const,
  fn: async () => delay(mockTransfers),
};

export type InitiateTransferInput = {
  assetId: string;
  toLocationId: string;
  reason: string;
};

export const initiateTransfer = {
  fn: async (input: InitiateTransferInput) => {
    const asset = mockAssets.find((a) => a.id === input.assetId);
    const toLocation = mockLocations.find((l) => l.id === input.toLocationId);
    if (!asset || !toLocation) throw { name: "ApiError", message: "Select an asset and a destination location." };

    const transfer: Transfer = {
      id: `transfer-${mockTransfers.length + 1}`,
      code: `TRF-${String(mockTransfers.length + 1).padStart(4, "0")}`,
      assetId: asset.id,
      assetDescription: asset.description,
      assetCode: asset.code,
      fromLocationId: asset.locationId,
      fromLocationName: asset.locationName,
      toLocationId: toLocation.id,
      toLocationName: toLocation.name,
      reason: input.reason,
      status: "pending",
      requestedBy: "Ama Mensah",
      createdAt: "Just now",
    };
    mockTransfers.unshift(transfer);
    return delay(transfer);
  },
};
