import { mockOrg, mockUsers } from "@/lib/mock-data";
import { delay } from "./mock";

export const getOrg = {
  key: ["org"] as const,
  fn: async () => delay(mockOrg),
};

export const getOrgUsers = {
  key: ["orgUsers"] as const,
  fn: async () => delay(mockUsers),
};
