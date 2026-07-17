"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { X } from "lucide-react";
import { toast } from "sonner";
import { getOrgUsers, getPendingInvites, inviteOrgUser, revokeInvite, updateOrgUser } from "@/api";
import type { OrgUser, Role } from "@/types/asset-platform";
import { DataTable, createSortableHeader } from "@/components/global/data-table";
import { PageContainer } from "@/components/global/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/providers/session-provider";

const roleLabels: Record<Role, string> = { org_admin: "Org admin", asset_manager: "Asset manager", viewer: "Viewer" };

export default function UsersPage() {
  const { isAdmin } = useSession();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const { data: users, isPending } = useQuery({ queryKey: getOrgUsers.key, queryFn: getOrgUsers.fn });
  const { data: invites } = useQuery({ queryKey: getPendingInvites.key, queryFn: getPendingInvites.fn });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");

  const { mutate: sendInvite, isPending: isInviting } = useMutation({
    mutationFn: inviteOrgUser.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getPendingInvites.key });
      toast(`Invite sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("viewer");
    },
  });

  const { mutate: updateUser } = useMutation({
    mutationFn: updateOrgUser.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getOrgUsers.key });
    },
  });

  const { mutate: cancelInvite } = useMutation({
    mutationFn: revokeInvite.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getPendingInvites.key });
      toast("Invite revoked");
    },
  });

  const filtered = useMemo(() => {
    if (!search) return users ?? [];
    return (users ?? []).filter(
      (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()),
    );
  }, [users, search]);

  const columns = useMemo<ColumnDef<OrgUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: createSortableHeader("Name"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
              {row.original.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
            <span className="text-[13.5px] font-medium">{row.original.name}</span>
          </div>
        ),
      },
      { accessorKey: "email", header: "Email", cell: ({ row }) => <span className="text-[13px] text-muted-foreground">{row.original.email}</span> },
      {
        accessorKey: "role",
        header: "Role",
        meta: {
          filter: {
            type: "select",
            options: Object.entries(roleLabels).map(([value, label]) => ({ label, value })),
          },
        },
        cell: ({ row }) =>
          isAdmin ? (
            <select
              value={row.original.role}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateUser({ userId: row.original.id, role: e.target.value as Role })}
              className="h-7 rounded-md border border-input bg-card px-2 text-[12.5px] font-medium"
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[13px]">{roleLabels[row.original.role]}</span>
          ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        filterFn: (row, columnId, filterValue) => String(row.getValue(columnId)) === filterValue,
        meta: {
          filter: {
            type: "select",
            options: [
              { label: "Active", value: "true" },
              { label: "Inactive", value: "false" },
            ],
          },
        },
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "secondary" : "outline"} className="gap-1.5">
            <span className={`size-1.5 rounded-full ${row.original.isActive ? "bg-status-good" : "bg-muted-foreground"}`} />
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      { accessorKey: "lastActive", header: "Last active", cell: ({ row }) => <span className="text-[12.5px] text-muted-foreground">{row.original.lastActive}</span> },
      ...(isAdmin
        ? [
            {
              id: "actions",
              header: "",
              cell: ({ row }: { row: { original: OrgUser } }) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateUser({ userId: row.original.id, isActive: !row.original.isActive });
                  }}
                  className="text-[12.5px] font-semibold text-accent-foreground"
                >
                  {row.original.isActive ? "Deactivate" : "Activate"}
                </button>
              ),
            },
          ]
        : []),
    ],
    [isAdmin, updateUser],
  );

  return (
    <PageContainer>
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Manage organization users and permissions</p>
        </div>
        {isAdmin && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>Invite user</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite user</DialogTitle>
              </DialogHeader>
              <div className="space-y-3.5">
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Email</Label>
                  <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="person@org.com" />
                </div>
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Role</Label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                    className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
                  >
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={!inviteEmail || isInviting}
                  onClick={() => sendInvite({ email: inviteEmail, role: inviteRole })}
                >
                  Send invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <div className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-card px-2.5 sm:w-[280px]">
          <span className="text-sm text-muted-foreground">⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="flex-1 border-none bg-transparent text-[13.5px] outline-none"
          />
        </div>
      </div>

      <DataTable data={filtered} columns={columns} isLoading={isPending} pageSize={20} emptyTitle="No users match these filters" />

      {isAdmin && invites && invites.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Pending invites</div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-b-0">
                <div>
                  <div className="text-[13.5px] font-medium">{invite.email}</div>
                  <div className="text-xs text-muted-foreground">{roleLabels[invite.role]} · sent {invite.createdAt}</div>
                </div>
                <button onClick={() => cancelInvite(invite.id)} className="text-muted-foreground/50 hover:text-status-bad">
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
