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

export type AddCategoryInput = {
  name: string;
  code: string;
};

export const addCategory = {
  fn: async (input: AddCategoryInput): Promise<CategoryOption> => {
    try {
      const res = await client.post<{ category: CategoryOption }>("/api/categories", input);
      return res.data.category;
    } catch (error) {
      throwError(error);
    }
  },
};

export type UpdateCategoryInput = {
  id: string;
  name?: string;
  isActive?: boolean;
};

export const updateCategory = {
  fn: async ({ id, ...fields }: UpdateCategoryInput): Promise<CategoryOption> => {
    try {
      const res = await client.patch<{ category: CategoryOption }>(`/api/categories/${id}`, fields);
      return res.data.category;
    } catch (error) {
      throwError(error);
    }
  },
};

export const deleteCategory = {
  fn: async (id: string): Promise<{ ok: true }> => {
    try {
      const res = await client.delete<{ ok: true }>(`/api/categories/${id}`);
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};
