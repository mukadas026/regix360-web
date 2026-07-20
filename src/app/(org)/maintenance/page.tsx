"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "react-hot-toast";
import {
  addMaintenance,
  cancelMaintenance,
  client,
  completeMaintenance,
  getMaintenanceRecords,
  startMaintenance,
} from "@/api";
import type {
  AssetGroup,
  AssetStatus,
  AssetUnit,
  Condition,
  MaintenancePriority,
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenanceType,
} from "@/types/asset-platform";
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

const statusVariant: Record<MaintenanceStatus, "secondary" | "outline" | "default" | "destructive"> = {
  scheduled: "outline",
  in_progress: "default",
  completed: "secondary",
  cancelled: "destructive",
};

const priorityVariant: Record<MaintenancePriority, "destructive" | "default" | "secondary"> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

function MaintenanceContent() {
  const searchParams = useSearchParams();
  const prefillCode = searchParams.get("prefillCode");

  const { canEdit } = useSession();
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({ queryKey: getMaintenanceRecords.key({}), queryFn: () => getMaintenanceRecords.fn({}) });
  const records = data?.maintenance ?? [];

  const [open, setOpen] = useState(Boolean(prefillCode));
  const [assetSearch, setAssetSearch] = useState(prefillCode ?? "");
  const [manualGroup, setManualGroup] = useState<AssetGroup | null>(null);
  const [manualUnitId, setManualUnitId] = useState("");
  const [type, setType] = useState<MaintenanceType>("corrective");
  const [priority, setPriority] = useState<MaintenancePriority>("medium");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

  const { data: assetGroups, isFetching: isSearchingAssets } = useQuery({
    queryKey: ["maintenance-asset-groups", assetSearch],
    queryFn: async () => {
      const res = await client.get<{ groups: AssetGroup[] }>("/api/assets", {
        params: { search: assetSearch || undefined, pageSize: 100 },
      });
      return res.data.groups;
    },
    enabled: open,
  });

  // Quick-launch from the asset register's "Schedule maintenance" menu
  // item: the dialog opens pre-searched for that unit's code (state above);
  // once the search resolves to exactly one group, fall back to it — derived
  // here (not via effect) so it never fights a manual pick.
  const autoGroup =
    prefillCode && assetSearch === prefillCode && assetGroups?.length === 1 ? assetGroups[0] : null;
  const selectedGroup = manualGroup ?? autoGroup;

  const { data: units, isFetching: isLoadingUnits } = useQuery({
    queryKey: ["maintenance-asset-units", selectedGroup],
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

  const resetForm = () => {
    setAssetSearch("");
    setManualGroup(null);
    setManualUnitId("");
    setType("corrective");
    setPriority("medium");
    setScheduledAt("");
    setNotes("");
  };

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: addMaintenance.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      toast("Maintenance scheduled");
      setOpen(false);
      resetForm();
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message ?? "Failed to schedule maintenance");
    },
  });

  const { mutate: start, isPending: isStarting } = useMutation({
    mutationFn: startMaintenance.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      toast("Maintenance started");
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message ?? "Failed to start maintenance");
    },
  });

  const { mutate: cancel, isPending: isCancelling } = useMutation({
    mutationFn: cancelMaintenance.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      toast("Maintenance cancelled");
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message ?? "Failed to cancel maintenance");
    },
  });

  const [completingRecord, setCompletingRecord] = useState<MaintenanceRecord | null>(null);
  const [reassessCondition, setReassessCondition] = useState(false);
  const [completeCondition, setCompleteCondition] = useState<Condition>("good");
  const [completeStatus, setCompleteStatus] = useState<AssetStatus>("active");
  const [completeNotes, setCompleteNotes] = useState("");

  const resetCompleteForm = () => {
    setCompletingRecord(null);
    setReassessCondition(false);
    setCompleteCondition("good");
    setCompleteStatus("active");
    setCompleteNotes("");
  };

  const { mutate: complete, isPending: isCompleting } = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof completeMaintenance.fn>[1] }) => completeMaintenance.fn(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      toast("Maintenance completed");
      resetCompleteForm();
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message ?? "Failed to complete maintenance");
    },
  });

  const columns = useMemo<ColumnDef<MaintenanceRecord>[]>(
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
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <span className="text-[13px] capitalize">{row.original.type}</span>,
        meta: {
          filter: {
            type: "select",
            options: [
              { label: "Corrective", value: "corrective" },
              { label: "Preventive", value: "preventive" },
            ],
          },
        },
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => <Badge variant={priorityVariant[row.original.priority]}>{row.original.priority}</Badge>,
        meta: {
          filter: {
            type: "select",
            options: [
              { label: "High", value: "high" },
              { label: "Medium", value: "medium" },
              { label: "Low", value: "low" },
            ],
          },
        },
      },
      {
        accessorKey: "scheduled_at",
        header: createSortableHeader("Scheduled"),
        cell: ({ row }) => <span className="font-mono text-[12.5px] text-muted-foreground">{row.original.scheduled_at}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status.replace("_", " ")}</Badge>,
        meta: {
          filter: {
            type: "select",
            options: [
              { label: "Scheduled", value: "scheduled" },
              { label: "In progress", value: "in_progress" },
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
              cell: ({ row }: { row: { original: MaintenanceRecord } }) => {
                const record = row.original;
                if (record.status !== "scheduled" && record.status !== "in_progress") return null;
                return (
                  <div className="flex items-center gap-2">
                    {record.status === "scheduled" && (
                      <Button size="sm" variant="outline" disabled={isStarting} onClick={() => start(record.id)}>
                        Start
                      </Button>
                    )}
                    <Button size="sm" variant="outline" disabled={isCompleting} onClick={() => setCompletingRecord(record)}>
                      Complete
                    </Button>
                    <Button size="sm" variant="ghost" disabled={isCancelling} onClick={() => cancel(record.id)}>
                      Cancel
                    </Button>
                  </div>
                );
              },
            } satisfies ColumnDef<MaintenanceRecord>,
          ]
        : []),
    ],
    [canEdit, start, cancel, isStarting, isCompleting, isCancelling],
  );

  return (
    <PageContainer>
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Maintenance</h1>
          <p className="text-sm text-muted-foreground">Asset maintenance tracking and scheduling</p>
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
              <Button>New maintenance</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New maintenance</DialogTitle>
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
                    value={
                      selectedGroup
                        ? `${selectedGroup.location_id}|${selectedGroup.department_id}|${selectedGroup.category_item_id}|${selectedGroup.description}`
                        : ""
                    }
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
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 text-[12.5px] font-semibold">Type</Label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as MaintenanceType)}
                      className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
                    >
                      <option value="corrective">Corrective</option>
                      <option value="preventive">Preventive</option>
                    </select>
                  </div>
                  <div>
                    <Label className="mb-1.5 text-[12.5px] font-semibold">Priority</Label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
                      className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Scheduled date</Label>
                  <Input type="date" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Notes (optional)</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter notes" />
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={!unitId || !scheduledAt || isSaving}
                  onClick={() =>
                    mutate({
                      assetId: unitId,
                      type,
                      priority,
                      scheduledAt,
                      notes: notes || undefined,
                    })
                  }
                >
                  Create maintenance
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <DataTable data={records} columns={columns} isLoading={isPending} pageSize={20} emptyTitle="No maintenance records yet" />

      <Dialog
        open={Boolean(completingRecord)}
        onOpenChange={(next) => {
          if (!next) resetCompleteForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete maintenance</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <p className="text-[13px] text-muted-foreground">
              {completingRecord?.asset_description} — <AssetCodeChip code={completingRecord?.asset_code ?? ""} className="text-[9.5px]" />
            </p>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={reassessCondition} onChange={(e) => setReassessCondition(e.target.checked)} />
              Reassess condition / status on completion
            </label>
            {reassessCondition && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Condition</Label>
                  <select
                    value={completeCondition}
                    onChange={(e) => setCompleteCondition(e.target.value as Condition)}
                    className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
                  >
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="bad">Bad</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Status</Label>
                  <select
                    value={completeStatus}
                    onChange={(e) => setCompleteStatus(e.target.value as AssetStatus)}
                    className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
                  >
                    <option value="active">Active</option>
                    <option value="under_maintenance">Under maintenance</option>
                    <option value="disposed">Disposed</option>
                    <option value="missing">Missing</option>
                  </select>
                </div>
              </div>
            )}
            <div>
              <Label className="mb-1.5 text-[12.5px] font-semibold">Notes (optional)</Label>
              <Textarea value={completeNotes} onChange={(e) => setCompleteNotes(e.target.value)} placeholder="Enter notes" />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={isCompleting}
              onClick={() => {
                if (!completingRecord) return;
                complete({
                  id: completingRecord.id,
                  input: {
                    condition: reassessCondition ? completeCondition : undefined,
                    status: reassessCondition ? completeStatus : undefined,
                    notes: completeNotes || undefined,
                  },
                });
              }}
            >
              Mark complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense>
      <MaintenanceContent />
    </Suspense>
  );
}
