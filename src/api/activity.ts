import { mockActivityLog } from "@/lib/mock-data";
import { delay } from "./mock";

export const getActivityLog = {
  key: ["activityLog"] as const,
  fn: async () => delay(mockActivityLog),
};
