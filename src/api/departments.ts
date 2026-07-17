import { mockDepartments, mockLocations } from "@/lib/mock-data";
import type { Department } from "@/types/asset-platform";
import { delay } from "./mock";

export const getDepartments = {
  key: ["departments"] as const,
  fn: async () => delay(mockDepartments),
};

export type AddDepartmentInput = {
  name: string;
  code: string;
  locationId: string;
};

export const addDepartment = {
  fn: async (input: AddDepartmentInput) => {
    const location = mockLocations.find((l) => l.id === input.locationId);
    const department: Department = {
      id: `dept-${mockDepartments.length + 1}`,
      name: input.name,
      code: input.code.toUpperCase(),
      locationId: input.locationId,
      locationName: location?.name ?? "",
      isActive: true,
      createdAt: "Just now",
    };
    mockDepartments.unshift(department);
    return delay(department);
  },
};
