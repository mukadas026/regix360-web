"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { addDisposal, getAssets, getDisposalRecords } from "@/api";
import type { DisposalMethod, DisposalRecord, DisposalStatus } from "@/types/asset-platform";
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

const statusVariant: Record<DisposalStatus, "outline" | "default" | "secondary"> = {
  pending_approval: "outline",
  approved: "default",
  completed: "secondary",
};

export default function DisposalPage() {
  const { canEdit } = useSession();
  const queryClient = useQueryClient();
  const { data: records, isPending } = useQuery({ queryKey: getDisposalRecords.key, queryFn: getDisposalRecords.fn });
  const { data: assets } = useQuery({ queryKey: getAssets.key({}), queryFn: () => getAssets.fn({}) });

  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [method, setMethod] = useState<DisposalMethod>("scrapped");
  const [reason, setReason] = useState("");
  const [proceeds, setProceeds] = useState("");

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: addDisposal.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getDisposalRecords.key });
      toast("Disposal request submitted");
      setOpen(false);
      setAssetId("");
      setReason("");
      setProceeds("");
    },
  });

  const columns = useMemo<ColumnDef<DisposalRecord>[]>(
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
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => <span className="text-[13px] capitalize">{row.original.method.replace("_", " ")}</span>,
        meta: {
          filter: {
            type: "select",
            options: [
              { label: "Scrapped", value: "scrapped" },
              { label: "Sold", value: "sold" },
              { label: "Donated", value: "donated" },
              { label: "Written off", value: "written_off" },
            ],
          },
        },
      },
      {
        accessorKey: "proceeds",
        header: () => <div className="text-right">Proceeds</div>,
        cell: ({ row }) => <div className="text-right font-mono text-[13px]">{row.original.proceeds != null ? `GHS ${row.original.proceeds}` : "—"}</div>,
      },
      { accessorKey: "requestedAt", header: createSortableHeader("Requested"), cell: ({ row }) => <span className="text-[12.5px] text-muted-foreground">{row.original.requestedAt}</span> },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status.replace("_", " ")}</Badge>,
        meta: {
          filter: {
            type: "select",
            options: [
              { label: "Pending approval", value: "pending_approval" },
              { label: "Approved", value: "approved" },
              { label: "Completed", value: "completed" },
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
          <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Disposal</h1>
          <p className="text-sm text-muted-foreground">Track assets marked for disposal</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Dispose asset</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dispose asset</DialogTitle>
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
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Method</Label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as DisposalMethod)}
                    className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
                  >
                    <option value="scrapped">Scrapped</option>
                    <option value="sold">Sold</option>
                    <option value="donated">Donated</option>
                    <option value="written_off">Written off</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Reason</Label>
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason for disposal" />
                </div>
                {method === "sold" && (
                  <div>
                    <Label className="mb-1.5 text-[12.5px] font-semibold">Proceeds (GHS)</Label>
                    <Input type="number" min={0} value={proceeds} onChange={(e) => setProceeds(e.target.value)} placeholder="0.00" />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  disabled={!assetId || !reason || isSaving}
                  onClick={() =>
                    mutate({ assetId, method, reason, proceeds: proceeds ? Number(proceeds) : null })
                  }
                >
                  Submit for approval
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <DataTable data={records ?? []} columns={columns} isLoading={isPending} pageSize={20} emptyTitle="No disposal records yet" />
    </PageContainer>
  );
}
