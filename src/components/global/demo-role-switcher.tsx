"use client";

import { useSession } from "@/providers/session-provider";
import type { Role } from "@/types/asset-platform";
import { cn } from "@/lib/utils";

const roles: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "asset_manager", label: "Manager" },
  { value: "viewer", label: "Viewer" },
];

export function DemoRoleSwitcher() {
  const { role, setRole } = useSession();

  return (
    <div className="fixed bottom-3.5 left-3.5 z-50 flex items-center gap-1.5 rounded-lg border border-border bg-card p-1.5 shadow-md">
      <span className="hidden px-1 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase sm:inline">
        Demo role
      </span>
      {roles.map((r) => (
        <button
          key={r.value}
          onClick={() => setRole(r.value)}
          className={cn(
            "rounded-lg px-2 py-1 text-[11px] font-semibold",
            role === r.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
