"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { cancelTransfer, client, completeTransfer, getDepartments, getTransfers, initiateTransfer } from "@/api";
import type { AssetGroup, AssetUnit, Location, Transfer, TransferStatus } from "@/types/asset-platform";
import { AssetCodeChip } from "@/components/global/asset-code-chip";
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
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/providers/session-provider";

const statusVariant: Record<TransferStatus, "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  completed: "secondary",
  cancelled: "destructive",
};

function TransfersContent() {
  const searchParams = useSearchParams();
  const prefillCode = searchParams.get("prefillCode");

  const { canEdit, isAdmin } = useSession();
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({ queryKey: getTransfers.key({}), queryFn: () => getTransfers.fn({}) });
  const transfers = data?.transfers ?? [];

  const [open, setOpen] = useState(Boolean(prefillCode));
  const [assetSearch, setAssetSearch] = useState(prefillCode ?? "");
  const [manualGroup, setManualGroup] = useState<AssetGroup | null>(null);
  const [manualUnitId, setManualUnitId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [toDepartmentId, setToDepartmentId] = useState("");
  const [toCustodianId, setToCustodianId] = useState("");
  const [reason, setReason] = useState("");

  const { data: assetGroups, isFetching: isSearchingAssets } = useQuery({
    queryKey: ["transfer-asset-groups", assetSearch],
    queryFn: async () => {
      const res = await client.get<{ groups: AssetGroup[] }>("/api/assets", {
        params: { search: assetSearch || undefined, pageSize: 100 },
      });
      return res.data.groups;
    },
    enabled: open,
  });

  // Quick-launch from the asset register's "Initiate transfer" menu item:
  // the dialog opens pre-searched for that unit's code (state above); once
  // the search resolves to exactly one group, use it as a fallback selection
  // — derived here (not via effect) so it never fights a manual pick.
  const autoGroup =
    prefillCode && assetSearch === prefillCode && assetGroups?.length === 1 ? assetGroups[0] : null;
  const selectedGroup = manualGroup ?? autoGroup;

  const { data: units, isFetching: isLoadingUnits } = useQuery({
    queryKey: ["transfer-asset-units", selectedGroup],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const res = await client.get<{ units: AssetUnit[] }>("/api/assets/units", {
        params: {
          description: selectedGroup.description,
          categoryItemId: selectedGroup.category_item_id,
          locationId: selectedGroup.location_id,
          departmentId: selectedGroup.department_id,
        },
      });
      return res.data.units;
    },
    enabled: open && Boolean(selectedGroup),
  });

  const autoUnitId = prefillCode ? (units?.find((u) => u.code === prefillCode)?.id ?? "") : "";
  const unitId = manualUnitId || autoUnitId;

  const { data: locations } = useQuery({
    queryKey: ["transfer-locations"],
    queryFn: async () => {
      const res = await client.get<{ locations: Location[] }>("/api/locations");
      return res.data.locations;
    },
    enabled: open,
  });

  const { data: departments } = useQuery({
    queryKey: getDepartments.key,
    queryFn: () => getDepartments.fn(),
    enabled: open,
  });

  // GET /api/users is org_admin-only, so the custodian picker only loads for admins;
  // asset_manager can still submit a transfer, just without picking a destination custodian.
  const { data: orgMembers } = useQuery({
    queryKey: ["transfer-org-members"],
    queryFn: async () => {
      const res = await client.get<{ members: { user_id: string; full_name: string | null; email: string; is_active: boolean }[] }>(
        "/api/users",
      );
      return res.data.members.filter((m) => m.is_active);
    },
    enabled: open && isAdmin,
  });

  const resetForm = () => {
    setAssetSearch("");
    setManualGroup(null);
    setManualUnitId("");
    setToLocationId("");
    setToDepartmentId("");
    setToCustodianId("");
    setReason("");
  };

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: initiateTransfer.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast("Transfer initiated");
      setOpen(false);
      resetForm();
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message ?? "Failed to initiate transfer");
    },
  });

  const { mutate: complete, isPending: isCompleting } = useMutation({
    mutationFn: completeTransfer.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast("Transfer completed — asset moved");
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message ?? "Failed to complete transfer");
    },
  });

  const { mutate: cancel, isPending: isCancelling } = useMutation({
    mutationFn: cancelTransfer.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast("Transfer cancelled");
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message ?? "Failed to cancel transfer");
    },
  });

  const columns = useMemo<ColumnDef<Transfer>[]>(
    () => [
      { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-mono text-[12.5px]">{row.original.code}</span> },
      {
        accessorKey: "asset_description",
        header: "Asset",
        cell: ({ row }) => (
          <div>
            <div className="text-[13.5px] font-medium">{row.original.asset_description}</div>
            <AssetCodeChip code={row.original.asset_code} className="text-[9.5px]" />
          </div>
        ),
      },
      {
        id: "route",
        header: "From → To",
        cell: ({ row }) => (
          <div className="text-[13px]">
            <div className="flex items-center gap-1.5">
              {row.original.from_location_name}
              <ArrowRight size={13} className="text-muted-foreground" />
              {row.original.to_location_name}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              {row.original.from_department_name}
              <ArrowRight size={11} />
              {row.original.to_department_name}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "requested_at",
        header: createSortableHeader("Requested"),
        cell: ({ row }) => <span className="text-[12.5px] text-muted-foreground">{row.original.requested_at}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge>,
        meta: {
          filter: {
            type: "select",
            options: [
              { label: "Pending", value: "pending" },
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" },
            ],
          },
        },
      },
      ...(canEdit
        ? [
            {
              id: "actions",
              header: "",
              cell: ({ row }: { row: { original: Transfer } }) =>
                row.original.status === "pending" ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isCompleting}
                      onClick={() => complete(row.original.id)}
                    >
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isCancelling}
                      onClick={() => cancel(row.original.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : null,
            } satisfies ColumnDef<Transfer>,
          ]
        : []),
    ],
    [canEdit, complete, cancel, isCompleting, isCancelling],
  );

  return (
    <PageContainer>
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Transfers</h1>
          <p className="text-sm text-muted-foreground">Asset transfer management and tracking</p>
        </div>
        {canEdit && (
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>Initiate transfer</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Initiate asset transfer</DialogTitle>
              </DialogHeader>
              <div className="space-y-3.5">
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Search asset</Label>
                  <Input
                    value={assetSearch}
                    onChange={(e) => {
                      setAssetSearch(e.target.value);
                      setManualGroup(null);
                      setManualUnitId("");
                    }}
                    placeholder="Search by description or code"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Asset group</Label>
                  <select
                    value={selectedGroup ? `${selectedGroup.location_id}|${selectedGroup.department_id}|${selectedGroup.category_item_id}|${selectedGroup.description}` : ""}
                    onChange={(e) => {
                      const group = assetGroups?.find(
                        (g) => `${g.location_id}|${g.department_id}|${g.category_item_id}|${g.description}` === e.target.value,
                      );
                      setManualGroup(group ?? null);
                      setManualUnitId("");
                    }}
                    className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
                  >
                    <option value="">{isSearchingAssets ? "Searching…" : "Select asset group"}</option>
                    {assetGroups?.map((g) => (
                      <option
                        key={`${g.location_id}|${g.department_id}|${g.category_item_id}|${g.description}`}
                        value={`${g.location_id}|${g.department_id}|${g.category_item_id}|${g.description}`}
                      >
                        {g.description} — {g.location_name} / {g.department_name} ({g.unit_count} units)
                      </option>
                    ))}
                  </select>
                </div>
                {selectedGroup && (
                  <div>
                    <Label className="mb-1.5 text-[12.5px] font-semibold">Unit</Label>
                    <select
                      value={unitId}
                      onChange={(e) => setManualUnitId(e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
                    >
                      <option value="">{isLoadingUnits ? "Loading units…" : "Select unit"}</option>
                      {units?.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.code} — {u.condition}
                          {u.custodian_name ? ` — ${u.custodian_name}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedGroup && (
                  <div>
                    <Label className="mb-1.5 text-[12.5px] font-semibold">From</Label>
                    <Input
                      value={`${selectedGroup.location_name} / ${selectedGroup.department_name}`}
                      disabled
                      readOnly
                      className="bg-secondary text-muted-foreground"
                    />
                  </div>
                )}
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">To location</Label>
                  <select
                    value={toLocationId}
                    onChange={(e) => setToLocationId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
                  >
                    <option value="">Select destination location</option>
                    {locations?.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">To department</Label>
                  <select
                    value={toDepartmentId}
                    onChange={(e) => setToDepartmentId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
                  >
                    <option value="">Select destination department</option>
                    {departments?.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                {isAdmin && (
                  <div>
                    <Label className="mb-1.5 text-[12.5px] font-semibold">Custodian (optional)</Label>
                    <select
                      value={toCustodianId}
                      onChange={(e) => setToCustodianId(e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
                    >
                      <option value="">No custodian</option>
                      {orgMembers?.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.full_name ?? m.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Reason (optional)</Label>
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason for transfer" />
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={!unitId || !toLocationId || !toDepartmentId || isSaving}
                  onClick={() =>
                    mutate({
                      assetId: unitId,
                      toLocationId,
                      toDepartmentId,
                      toCustodianId: toCustodianId || null,
                      reason: reason || undefined,
                    })
                  }
                >
                  Initiate transfer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <DataTable data={transfers} columns={columns} isLoading={isPending} pageSize={20} emptyTitle="No transfers yet" />
    </PageContainer>
  );
}

export default function TransfersPage() {
  return (
    <Suspense>
      <TransfersContent />
    </Suspense>
  );
}
