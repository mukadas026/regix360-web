"use client";

import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api";
import type { Role } from "@/types/asset-platform";

type SessionContextValue = {
  role: Role;
  orgId: string | null;
  isPending: boolean;
  canEdit: boolean;
  isAdmin: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useQuery({
    queryKey: getMe.key,
    queryFn: getMe.fn,
    retry: false,
  });

  const role: Role = data?.orgRole ?? "viewer";

  const value = useMemo<SessionContextValue>(
    () => ({
      role,
      orgId: data?.orgId ?? null,
      isPending,
      canEdit: role === "org_admin" || role === "asset_manager",
      isAdmin: role === "org_admin",
    }),
    [role, data?.orgId, isPending],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
