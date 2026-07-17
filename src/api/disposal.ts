import { mockAssets, mockDisposalRecords } from "@/lib/mock-data";
import type { DisposalMethod, DisposalRecord } from "@/types/asset-platform";
import { delay } from "./mock";

export const getDisposalRecords = {
  key: ["disposalRecords"] as const,
  fn: async () => delay(mockDisposalRecords),
};

export type AddDisposalInput = {
  assetId: string;
  method: DisposalMethod;
  reason: string;
  proceeds: number | null;
};

export const addDisposal = {
  fn: async (input: AddDisposalInput) => {
    const asset = mockAssets.find((a) => a.id === input.assetId);
    if (!asset) throw { name: "ApiError", message: "Select an asset." };

    const record: DisposalRecord = {
      id: `disp-${mockDisposalRecords.length + 1}`,
      code: `DSP-${String(mockDisposalRecords.length + 1).padStart(4, "0")}`,
      assetId: asset.id,
      assetDescription: asset.description,
      assetCode: asset.code,
      method: input.method,
      reason: input.reason,
      proceeds: input.proceeds,
      status: "pending_approval",
      requestedBy: "Ama Mensah",
      requestedAt: "Just now",
    };
    mockDisposalRecords.unshift(record);
    return delay(record);
  },
};
