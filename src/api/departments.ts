import { client, throwError } from "./client";
import type { Department } from "@/types/asset-platform";

export const getDepartments = {
  key: ["departments"] as const,
  fn: async (): Promise<Department[]> => {
    try {
      const res = await client.get<{ departments: Department[] }>("/api/departments");
      return res.data.departments;
    } catch (error) {
      throwError(error);
    }
  },
};

export type AddDepartmentInput = {
  name: string;
  code: string;
};

export const addDepartment = {
  fn: async (input: AddDepartmentInput): Promise<Department> => {
    try {
      const res = await client.post<{ department: Department }>("/api/departments", input);
      return res.data.department;
    } catch (error) {
      throwError(error);
    }
  },
};

export type UpdateDepartmentInput = {
  id: string;
  name: string;
};

export const updateDepartment = {
  fn: async ({ id, name }: UpdateDepartmentInput): Promise<Department> => {
    try {
      const res = await client.patch<{ department: Department }>(`/api/departments/${id}`, { name });
      return res.data.department;
    } catch (error) {
      throwError(error);
    }
  },
};

export const deleteDepartment = {
  fn: async (id: string): Promise<{ ok: true }> => {
    try {
      const res = await client.delete<{ ok: true }>(`/api/departments/${id}`);
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};
