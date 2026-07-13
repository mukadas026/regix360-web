import { mockAssets, mockVerificationCycles } from "@/lib/mock-data";
import { delay } from "./mock";

export const getVerificationCycles = {
  key: ["verificationCycles"] as const,
  fn: async () => delay(mockVerificationCycles),
};

export const getVerifyRows = {
  key: (locationId: string) => ["verifyRows", locationId] as const,
  fn: async (locationId: string) => {
    const rows = mockAssets.filter((a) => a.locationId === locationId).slice(0, 8);
    return delay(rows);
  },
};
