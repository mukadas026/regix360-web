"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { getOrgUsers, inviteUser, revokeInvite, updateMember } from "@/api";
import type { ApiError } from "@/api";
import type { OrgUser, Role } from "@/types/asset-platform";
import { AppDialog } from "@/components/global/app-dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/providers/session-provider";

const roleLabels: Record<Role, string> = { org_admin: "Org admin", asset_manager: "Asset manager", viewer: "Viewer" };

function getErrorMessage(error: unknown): string {
  return (error as ApiError)?.message ?? "Something went wrong.";
}

export default function UsersPage() {
  const { isAdmin } = useSession();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const { data, isPending } = useQuery({ queryKey: getOrgUsers.key, queryFn: getOrgUsers.fn });
  const users = data?.members;
  const invites = data?.pendingInvites;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");

  const { mutate: sendInvite, isPending: isInviting } = useMutation({
    mutationFn: inviteUser.fn,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: getOrgUsers.key });
      toast(result.note);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("viewer");
    },
    onError: (error) => toast(getErrorMessage(error)),
  });

  const { mutate: cancelInvite } = useMutation({
    mutationFn: revokeInvite.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getOrgUsers.key });
      toast("Invite revoked");
    },
    onError: (error) => toast(getErrorMessage(error)),
  });

  const [roleTarget, setRoleTarget] = useState<{ membershipId: string; name: string; role: Role } | null>(null);
  const [activeTarget, setActiveTarget] = useState<{ membershipId: string; name: string; isActive: boolean } | null>(
    null,
  );

  const { mutate: saveRole, isPending: isSavingRole } = useMutation({
    mutationFn: updateMember.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getOrgUsers.key });
      toast("Role updated");
      setRoleTarget(null);
    },
    onError: (error) => toast(getErrorMessage(error)),
  });

  const { mutate: saveActive, isPending: isSavingActive } = useMutation({
    mutationFn: updateMember.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getOrgUsers.key });
      toast(activeTarget?.isActive ? "User deactivated" : "User activated");
      setActiveTarget(null);
    },
    onError: (error) => toast(getErrorMessage(error)),
  });

  const filtered = useMemo(() => {
    if (!search) return users ?? [];
    return (users ?? []).filter(
      (u) =>
        (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()),
    );
  }, [users, search]);

  const columns = useMemo<ColumnDef<OrgUser>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: createSortableHeader("Name"),
        cell: ({ row }) => {
          const displayName = row.original.full_name ?? row.original.email;
          return (
            <div className="flex items-center gap-2.5">
              <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
                {displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="text-[13.5px] font-medium">{displayName}</span>
            </div>
          );
        },
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
        cell: ({ row }) => <span className="text-[13px]">{roleLabels[row.original.role]}</span>,
      },
      {
        accessorKey: "is_active",
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
          <Badge variant={row.original.is_active ? "secondary" : "outline"} className="gap-1.5">
            <span className={`size-1.5 rounded-full ${row.original.is_active ? "bg-status-good" : "bg-muted-foreground"}`} />
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "last_active_at",
        header: "Last active",
        cell: ({ row }) => <span className="text-[12.5px] text-muted-foreground">{row.original.last_active_at ?? "Never"}</span>,
      },
      ...(isAdmin
        ? [
            {
              id: "actions",
              header: "",
              cell: ({ row }: { row: { original: OrgUser } }) => (
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" title="More actions">
                        <MoreHorizontal size={15} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() =>
                          setRoleTarget({
                            membershipId: row.original.membership_id,
                            name: row.original.full_name ?? row.original.email,
                            role: row.original.role,
                          })
                        }
                      >
                        Change role
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setActiveTarget({
                            membershipId: row.original.membership_id,
                            name: row.original.full_name ?? row.original.email,
                            isActive: row.original.is_active,
                          })
                        }
                      >
                        {row.original.is_active ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ),
            },
          ]
        : []),
    ],
    [isAdmin],
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
                  <div className="text-xs text-muted-foreground">{roleLabels[invite.role]} · sent {invite.created_at}</div>
                </div>
                <button onClick={() => cancelInvite(invite.id)} className="text-muted-foreground/50 hover:text-status-bad">
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {roleTarget && (
        <AppDialog
          open={Boolean(roleTarget)}
          onOpenChange={(open) => !open && setRoleTarget(null)}
          kind="modal"
          title={`Change role — ${roleTarget.name}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setRoleTarget(null)} disabled={isSavingRole}>
                Cancel
              </Button>
              <Button
                disabled={isSavingRole}
                onClick={() => saveRole({ membershipId: roleTarget.membershipId, role: roleTarget.role })}
              >
                Save
              </Button>
            </>
          }
        >
          <select
            value={roleTarget.role}
            onChange={(e) => setRoleTarget({ ...roleTarget, role: e.target.value as Role })}
            className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
          >
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </AppDialog>
      )}

      {activeTarget && (
        <AppDialog
          open={Boolean(activeTarget)}
          onOpenChange={(open) => !open && setActiveTarget(null)}
          kind="confirm"
          severity={activeTarget.isActive ? "warning" : "info"}
          title={activeTarget.isActive ? `Deactivate ${activeTarget.name}?` : `Activate ${activeTarget.name}?`}
          description={
            activeTarget.isActive
              ? "They will immediately lose access to this organization."
              : "They will regain access to this organization."
          }
          isConfirming={isSavingActive}
          onConfirm={() =>
            saveActive({ membershipId: activeTarget.membershipId, isActive: !activeTarget.isActive })
          }
        />
      )}
    </PageContainer>
  );
}
