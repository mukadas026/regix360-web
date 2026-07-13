"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Role } from "@/types/asset-platform";

type SessionContextValue = {
  role: Role;
  setRole: (role: Role) => void;
  canEdit: boolean;
  isAdmin: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("admin");

  const value = useMemo<SessionContextValue>(
    () => ({
      role,
      setRole,
      canEdit: role === "admin" || role === "asset_manager",
      isAdmin: role === "admin",
    }),
    [role],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
