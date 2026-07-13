import { mockLocations } from "@/lib/mock-data";
import type { Location } from "@/types/asset-platform";
import { delay } from "./mock";

export const getLocations = {
  key: ["locations"] as const,
  fn: async () => delay(mockLocations),
};

export type AddLocationInput = {
  name: string;
  address: string | null;
};

export const addLocation = {
  fn: async (input: AddLocationInput) => {
    const location: Location = {
      id: `loc-${mockLocations.length + 1}`,
      name: input.name,
      address: input.address,
      assetCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    mockLocations.push(location);
    return delay(location);
  },
};
