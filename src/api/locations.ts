import { client, throwError } from "./client";
import type { Location } from "@/types/asset-platform";

export const getLocations = {
  key: ["locations"] as const,
  fn: async (): Promise<Location[]> => {
    try {
      const res = await client.get<{ locations: Location[] }>("/api/locations");
      return res.data.locations;
    } catch (error) {
      throwError(error);
    }
  },
};

export type AddLocationInput = {
  name: string;
  code: string;
  address?: string | null;
};

export const addLocation = {
  fn: async (input: AddLocationInput): Promise<Location> => {
    try {
      const res = await client.post<{ location: Location }>("/api/locations", input);
      return res.data.location;
    } catch (error) {
      throwError(error);
    }
  },
};

export type UpdateLocationInput = {
  id: string;
  name?: string;
  address?: string | null;
};

export const updateLocation = {
  fn: async ({ id, ...input }: UpdateLocationInput): Promise<Location> => {
    try {
      const res = await client.patch<{ location: Location }>(`/api/locations/${id}`, input);
      return res.data.location;
    } catch (error) {
      throwError(error);
    }
  },
};

export const deleteLocation = {
  fn: async (id: string): Promise<{ ok: true }> => {
    try {
      const res = await client.delete<{ ok: true }>(`/api/locations/${id}`);
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};
