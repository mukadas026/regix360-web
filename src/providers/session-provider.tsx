"use client";

import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api";
import type { PlatformRole, Role } from "@/types/asset-platform";

type SessionContextValue = {
  role: Role;
  orgId: string | null;
  platformRole: PlatformRole | null;
  isImpersonating: boolean;
  isPending: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  user: { id: string; email: string; fullName: string | null } | null;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useQuery({
    queryKey: getMe.key,
    queryFn: getMe.fn,
    retry: false,
  });

  const role: Role = data?.org?.role ?? "viewer";
  const isImpersonating = Boolean(data?.impersonating);

  const value = useMemo<SessionContextValue>(
    () => ({
      role,
      orgId: data?.org?.id ?? null,
      platformRole: data?.platformRole ?? null,
      isImpersonating,
      isPending,
      // Impersonated sessions are read-only server-side regardless of role — mirror that here.
      canEdit: !isImpersonating && (role === "org_admin" || role === "asset_manager"),
      isAdmin: !isImpersonating && role === "org_admin",
      user: data?.user ?? null,
    }),
    [role, data?.org?.id, data?.platformRole, isImpersonating, isPending, data?.user],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
