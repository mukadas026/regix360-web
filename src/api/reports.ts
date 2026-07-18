import { client, throwError } from "./client";
import type { AssetFilters } from "./assets";

export const reportDefinitions = [
  { key: "register", icon: "📋", title: "Asset register", desc: "Full list, filterable — the canonical export." },
  { key: "condition-location", icon: "📍", title: "Condition by location", desc: "Good/fair/bad split for every location." },
  { key: "condition-category", icon: "🗂", title: "Condition by category", desc: "Good/fair/bad split for every category." },
  { key: "verification", icon: "✓", title: "Verification report", desc: "Pick a past cycle and view its diff." },
];

// These endpoints require the same Bearer auth as everything else, so a plain
// <a href> won't work (browsers don't attach custom headers on navigation) —
// fetch each authenticated as a blob and trigger the download client-side.
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const downloadRegisterReport = {
  fn: async (filters: AssetFilters = {}) => {
    try {
      const res = await client.get("/api/reports/register.xlsx", {
        responseType: "blob",
        params: {
          search: filters.search || undefined,
          locationIds: filters.locationIds?.length ? filters.locationIds.join(",") : undefined,
          departmentIds: filters.departmentIds?.length ? filters.departmentIds.join(",") : undefined,
          categoryIds: filters.categoryIds?.length ? filters.categoryIds.join(",") : undefined,
          conditions: filters.conditions?.length ? filters.conditions.join(",") : undefined,
        },
      });
      triggerDownload(res.data as Blob, "register.xlsx");
    } catch (error) {
      throwError(error);
    }
  },
};

export const downloadConditionByLocationReport = {
  fn: async () => {
    try {
      const res = await client.get("/api/reports/condition-by-location.xlsx", { responseType: "blob" });
      triggerDownload(res.data as Blob, "condition-by-location.xlsx");
    } catch (error) {
      throwError(error);
    }
  },
};

export const downloadConditionByCategoryReport = {
  fn: async () => {
    try {
      const res = await client.get("/api/reports/condition-by-category.xlsx", { responseType: "blob" });
      triggerDownload(res.data as Blob, "condition-by-category.xlsx");
    } catch (error) {
      throwError(error);
    }
  },
};

export const downloadVerificationReport = {
  fn: async (cycleId: string) => {
    try {
      const res = await client.get(`/api/reports/verification/${cycleId}.xlsx`, { responseType: "blob" });
      triggerDownload(res.data as Blob, `verification-${cycleId}.xlsx`);
    } catch (error) {
      throwError(error);
    }
  },
};
