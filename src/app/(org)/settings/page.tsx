"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { getOrg, getOrgUsers } from "@/api";
import type { OrgUser } from "@/types/asset-platform";
import { DataTable, createSortableHeader } from "@/components/global/data-table";
import { PageContainer } from "@/components/global/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/providers/session-provider";

const roleLabels = { admin: "Admin", asset_manager: "Asset manager", viewer: "Viewer" };

export default function SettingsPage() {
  const { isAdmin } = useSession();
  const { data: org } = useQuery({ queryKey: getOrg.key, queryFn: getOrg.fn });
  const { data: users, isPending: usersPending } = useQuery({
    queryKey: getOrgUsers.key,
    queryFn: getOrgUsers.fn,
    enabled: isAdmin,
  });

  const columns = useMemo<ColumnDef<OrgUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: createSortableHeader("Name"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <span className="flex size-[26px] items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
              {row.original.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
            {row.original.name}
          </div>
        ),
      },
      { accessorKey: "email", header: "Email", cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span> },
      { accessorKey: "role", header: "Role", cell: ({ row }) => roleLabels[row.original.role] },
      { accessorKey: "lastActive", header: "Last active", cell: ({ row }) => <span className="text-[12.5px] text-muted-foreground">{row.original.lastActive}</span> },
    ],
    [],
  );

  return (
    <PageContainer>
      <h1 className="mb-[22px] font-heading text-2xl font-semibold tracking-tight">Settings</h1>

      <div className="mb-4 rounded-xl border border-border bg-card px-6 py-[22px]">
        <div className="mb-4 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Organization
        </div>
        {!org ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 text-[12.5px] font-semibold">Name</Label>
              <Input defaultValue={org.name} />
            </div>
            <div>
              <Label className="mb-1.5 text-[12.5px] font-semibold">Contact email</Label>
              <Input defaultValue={org.contactEmail} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-[12.5px] font-semibold">Address</Label>
              <Input defaultValue={org.address} />
            </div>
          </div>
        )}
      </div>

      {isAdmin && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Users &amp; roles
            </div>
            <Button variant="outline" size="sm" onClick={() => toast("Invite user — not wired up yet")}>
              Invite user
            </Button>
          </div>
          <DataTable data={users ?? []} columns={columns} isLoading={usersPending} pageSize={20} />
        </div>
      )}
    </PageContainer>
  );
}
