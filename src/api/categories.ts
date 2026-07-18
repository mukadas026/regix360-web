import { client, throwError } from "./client";
import type { CategoryOption } from "@/types/asset-platform";

export const getCategories = {
  key: (search: string) => ["categories", search] as const,
  fn: async (search = "") => {
    try {
      const res = await client.get<{ items: CategoryOption[] }>("/api/categories", {
        params: search ? { search } : undefined,
      });
      return res.data.items;
    } catch (error) {
      throwError(error);
    }
  },
};
