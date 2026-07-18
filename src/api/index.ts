export { client, throwError, BASE_URL, TOKEN_COOKIE } from "./client";
export type { ApiError } from "./client";

// Feature endpoints live in sibling files and are re-exported here. Each
// endpoint is `{ key, fn }`, consumed directly with useQuery/useMutation —
// see src/api/client.ts for the shared axios instance.
//
// Every module below calls the real API (regix360-backend). Only `getOrg`
// in ./org stays mock-backed — no org-profile endpoint exists yet.
export * from "./auth";
export * from "./assets";
export * from "./locations";
export * from "./verification";
export * from "./reports";
export * from "./org";
export * from "./dashboard";
export * from "./categories";
export * from "./imports";
export * from "./departments";
export * from "./transfers";
export * from "./maintenance";
export * from "./disposal";
export * from "./activity";
