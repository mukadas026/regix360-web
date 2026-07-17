"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { addMaintenance, getAssets, getMaintenanceRecords } from "@/api";
import type { MaintenancePriority, MaintenanceRecord, MaintenanceStatus, MaintenanceType } from "@/types/asset-platform";
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

export default function MaintenancePage() {
  const { canEdit } = useSession();
  const queryClient = useQueryClient();
  const { data: records, isPending } = useQuery({ queryKey: getMaintenanceRecords.key, queryFn: getMaintenanceRecords.fn });
  const { data: assets } = useQuery({ queryKey: getAssets.key({}), queryFn: () => getAssets.fn({}) });

  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [type, setType] = useState<MaintenanceType>("corrective");
  const [priority, setPriority] = useState<MaintenancePriority>("medium");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: addMaintenance.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getMaintenanceRecords.key });
      toast("Maintenance scheduled");
      setOpen(false);
      setAssetId("");
      setDescription("");
      setScheduledDate("");
      setEstimatedHours("");
    },
  });

  const columns = useMemo<ColumnDef<MaintenanceRecord>[]>(
    () => [
      { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-mono text-[12.5px]">{row.original.code}</span> },
      {
        accessorKey: "assetDescription",
        header: "Asset",
        cell: ({ row }) => (
          <div>
            <div className="text-[13.5px] font-medium">{row.original.assetDescription}</div>
            <AssetCodeChip code={row.original.assetCode} className="text-[9.5px]" />
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
      { accessorKey: "scheduledDate", header: createSortableHeader("Scheduled"), cell: ({ row }) => <span className="font-mono text-[12.5px] text-muted-foreground">{row.original.scheduledDate}</span> },
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
    ],
    [],
  );

  return (
    <PageContainer>
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Maintenance</h1>
          <p className="text-sm text-muted-foreground">Asset maintenance tracking and scheduling</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>New maintenance</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New maintenance</DialogTitle>
              </DialogHeader>
              <div className="space-y-3.5">
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Asset</Label>
                  <select
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
                  >
                    <option value="">Select asset</option>
                    {assets?.rows.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.description} — {a.code}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter description" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 text-[12.5px] font-semibold">Scheduled date</Label>
                    <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                  </div>
                  <div>
                    <Label className="mb-1.5 text-[12.5px] font-semibold">Estimated hours</Label>
                    <Input type="number" min={0} value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} placeholder="0" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={!assetId || !description || !scheduledDate || isSaving}
                  onClick={() =>
                    mutate({
                      assetId,
                      type,
                      priority,
                      description,
                      scheduledDate,
                      estimatedHours: estimatedHours ? Number(estimatedHours) : null,
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

      <DataTable data={records ?? []} columns={columns} isLoading={isPending} pageSize={20} emptyTitle="No maintenance records yet" />
    </PageContainer>
  );
}
