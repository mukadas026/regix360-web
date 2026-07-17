"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { getAssets, getLocations, getTransfers, initiateTransfer } from "@/api";
import type { Transfer, TransferStatus } from "@/types/asset-platform";
import { AssetCodeChip } from "@/components/global/asset-code-chip";
import { DataTable } from "@/components/global/data-table";
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

export default function TransfersPage() {
  const { canEdit } = useSession();
  const queryClient = useQueryClient();
  const { data: transfers, isPending } = useQuery({ queryKey: getTransfers.key, queryFn: getTransfers.fn });
  const { data: assets } = useQuery({ queryKey: getAssets.key({}), queryFn: () => getAssets.fn({}) });
  const { data: locations } = useQuery({ queryKey: getLocations.key, queryFn: getLocations.fn });

  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [reason, setReason] = useState("");

  const selectedAsset = assets?.rows.find((a) => a.id === assetId);

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: initiateTransfer.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getTransfers.key });
      toast("Transfer initiated");
      setOpen(false);
      setAssetId("");
      setToLocationId("");
      setReason("");
    },
  });

  const columns = useMemo<ColumnDef<Transfer>[]>(
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
        id: "route",
        header: "From → To",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-[13px]">
            {row.original.fromLocationName}
            <ArrowRight size={13} className="text-muted-foreground" />
            {row.original.toLocationName}
          </div>
        ),
      },
      { accessorKey: "createdAt", header: "Date", cell: ({ row }) => <span className="text-[12.5px] text-muted-foreground">{row.original.createdAt}</span> },
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
    ],
    [],
  );

  return (
    <PageContainer>
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Transfers</h1>
          <p className="text-sm text-muted-foreground">Asset transfer management and tracking</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Initiate transfer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Initiate asset transfer</DialogTitle>
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
                  <Label className="mb-1.5 text-[12.5px] font-semibold">From location</Label>
                  <Input value={selectedAsset?.locationName ?? "—"} disabled readOnly className="bg-secondary text-muted-foreground" />
                </div>
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">To location</Label>
                  <select
                    value={toLocationId}
                    onChange={(e) => setToLocationId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
                  >
                    <option value="">Select destination</option>
                    {locations?.filter((l) => l.id !== selectedAsset?.locationId).map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Reason for transfer</Label>
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason for transfer" />
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={!assetId || !toLocationId || !reason || isSaving}
                  onClick={() => mutate({ assetId, toLocationId, reason })}
                >
                  Initiate transfer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <DataTable data={transfers ?? []} columns={columns} isLoading={isPending} pageSize={20} emptyTitle="No transfers yet" />
    </PageContainer>
  );
}
