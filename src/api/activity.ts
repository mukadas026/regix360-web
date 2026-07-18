import { client, throwError } from "./client";
import type { ActivityLogEntry } from "@/types/asset-platform";

export type GetActivityLogInput = {
  limit?: number;
};

export const getActivityLog = {
  key: ["activityLog"] as const,
  fn: async (input?: GetActivityLogInput): Promise<ActivityLogEntry[]> => {
    try {
      const res = await client.get<{ entries: ActivityLogEntry[] }>("/api/audit-log", {
        params: { limit: input?.limit },
      });
      return res.data.entries;
    } catch (error) {
      throwError(error);
    }
  },
};
