"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "react-hot-toast";
import {
  approveDisposal,
  cancelDisposal,
  completeDisposal,
  getAssets,
  getAssetUnits,
  getDisposalRecords,
  requestDisposal,
} from "@/api";
import type { ApiError } from "@/api";
import type { AssetGroup, AssetUnit, DisposalMethod, DisposalRecord, DisposalStatus } from "@/types/asset-platform";
import { AssetCodeChip } from "@/components/global/asset-code-chip";
import { DataTable, createSortableHeader } from "@/components/global/data-table";
import { PageContainer } from "@/components/global/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/providers/session-provider";

const statusVariant: Record<DisposalStatus, "outline" | "default" | "secondary" | "destructive"> = {
  pending_approval: "outline",
  approved: "default",
  completed: "secondary",
  cancelled: "destructive",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function AssetPicker({
  selectedUnit,
  onSelect,
}: {
  selectedUnit: { unit: AssetUnit; group: AssetGroup } | null;
  onSelect: (value: { unit: AssetUnit; group: AssetGroup } | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<AssetGroup | null>(null);

  const { data: assetsResponse, isFetching: isSearching } = useQuery({
    queryKey: getAssets.key({ search }),
    queryFn: () => getAssets.fn({ search, pageSize: 20 }),
    enabled: open && !group && search.trim().length > 0,
  });

  const { data: units, isFetching: isLoadingUnits } = useQuery({
    queryKey: group
      ? getAssetUnits.key({
          description: group.description,
          categoryItemId: group.category_item_id,
          locationId: group.location_id,
          departmentId: group.department_id,
        })
      : ["asset-units", "idle"],
    queryFn: () =>
      getAssetUnits.fn({
        description: group!.description,
        categoryItemId: group!.category_item_id,
        locationId: group!.location_id,
        departmentId: group!.department_id,
      }),
    enabled: open && Boolean(group),
  });

  const groups = assetsResponse?.groups ?? [];

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setGroup(null);
          setSearch("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-start px-3 text-[13px] font-normal"
        >
          {selectedUnit ? (
            <span className="flex items-center gap-2 truncate">
              <span className="truncate">{selectedUnit.group.description}</span>
              <AssetCodeChip code={selectedUnit.unit.code} className="text-[9.5px]" />
            </span>
          ) : (
            <span className="text-muted-foreground">Select asset</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          {group ? (
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
              <span className="truncate text-[13px] font-medium">{group.description}</span>
              <button
                type="button"
                className="text-[12px] font-semibold text-accent-foreground"
                onClick={() => setGroup(null)}
              >
                Back
              </button>
            </div>
          ) : (
            <CommandInput placeholder="Search by description or code…" value={search} onValueChange={setSearch} />
          )}
          <CommandList>
            {!group && (
              <>
                {!isSearching && search.trim().length > 0 && groups.length === 0 && (
                  <CommandEmpty>No matching assets.</CommandEmpty>
                )}
                <CommandGroup>
                  {groups.map((g) => (
                    <CommandItem
                      key={`${g.category_item_id}-${g.location_id}-${g.department_id}-${g.description}`}
                      value={`${g.description}-${g.item_code}`}
                      onSelect={() => setGroup(g)}
                    >
                      <div className="flex w-full flex-col gap-0.5">
                        <span className="text-[13px] font-medium">{g.description}</span>
                        <span className="text-[11.5px] text-muted-foreground">
                          {g.item_code} · {g.location_name} · {g.unit_count} unit{g.unit_count === 1 ? "" : "s"}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            {group && (
              <>
                {!isLoadingUnits && (units?.length ?? 0) === 0 && <CommandEmpty>No units found.</CommandEmpty>}
                <CommandGroup>
                  {units
                    ?.filter((u) => u.status !== "disposed")
                    .map((u) => (
                      <CommandItem
                        key={u.id}
                        value={u.id}
                        onSelect={() => {
                          onSelect({ unit: u, group });
                          setOpen(false);
                        }}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <AssetCodeChip code={u.code} className="text-[10px]" />
                          <span className="text-[11.5px] text-muted-foreground capitalize">{u.condition} · {u.status.replace("_", " ")}</span>
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function DisposalPage() {
  const { canEdit } = useSession();
  const queryClient = useQueryClient();
  const { data: response, isPending } = useQuery({
    queryKey: getDisposalRecords.key({ pageSize: 100 }),
    queryFn: () => getDisposalRecords.fn({ pageSize: 100 }),
  });

  const [open, setOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<{ unit: AssetUnit; group: AssetGroup } | null>(null);
  const [method, setMethod] = useState<DisposalMethod>("scrapped");
  const [reason, setReason] = useState("");
  const [proceeds, setProceeds] = useState("");

  function resetForm() {
    setSelectedUnit(null);
    setMethod("scrapped");
    setReason("");
    setProceeds("");
  }

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: requestDisposal.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disposalRecords"] });
      toast("Disposal request submitted");
      setOpen(false);
      resetForm();
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not submit disposal request"),
  });

  const { mutate: approve, isPending: isApproving } = useMutation({
    mutationFn: approveDisposal.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disposalRecords"] });
      toast("Disposal approved");
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not approve disposal"),
  });

  const { mutate: complete, isPending: isCompleting } = useMutation({
    mutationFn: completeDisposal.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disposalRecords"] });
      toast("Disposal completed — asset marked disposed");
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not complete disposal"),
  });

  const { mutate: cancel, isPending: isCancelling } = useMutation({
    mutationFn: cancelDisposal.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disposalRecords"] });
      toast("Disposal cancelled");
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not cancel disposal"),
  });

  const isRowActionPending = isApproving || isCompleting || isCancelling;

  const columns = useMemo<ColumnDef<DisposalRecord>[]>(
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
      {
        accessorKey: "requested_by_name",
        header: "Requested by",
        cell: ({ row }) => <span className="text-[13px]">{row.original.requested_by_name}</span>,
      },
      {
        accessorKey: "requested_at",
        header: createSortableHeader("Requested"),
        cell: ({ row }) => <span className="text-[12.5px] text-muted-foreground">{formatDate(row.original.requested_at)}</span>,
      },
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
              cell: ({ row }: { row: { original: DisposalRecord } }) => {
                const record = row.original;
                if (record.status === "completed" || record.status === "cancelled") {
                  return null;
                }
                return (
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {record.status === "pending_approval" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isRowActionPending}
                        onClick={() => approve(record.id)}
                      >
                        Approve
                      </Button>
                    )}
                    {record.status === "approved" && (
                      <Button
                        size="sm"
                        disabled={isRowActionPending}
                        onClick={() => complete(record.id)}
                      >
                        Complete
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={isRowActionPending}
                      onClick={() => cancel(record.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                );
              },
            } satisfies ColumnDef<DisposalRecord>,
          ]
        : []),
    ],
    [canEdit, isRowActionPending, approve, complete, cancel],
  );

  return (
    <PageContainer>
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Disposal</h1>
          <p className="text-sm text-muted-foreground">Track assets marked for disposal</p>
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
              <Button>Dispose asset</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dispose asset</DialogTitle>
              </DialogHeader>
              <div className="space-y-3.5">
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Asset</Label>
                  <AssetPicker selectedUnit={selectedUnit} onSelect={setSelectedUnit} />
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
                  disabled={!selectedUnit || isSaving}
                  onClick={() =>
                    mutate({
                      assetId: selectedUnit!.unit.id,
                      method,
                      reason: reason || undefined,
                      proceeds: proceeds ? Number(proceeds) : undefined,
                    })
                  }
                >
                  Submit for approval
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <DataTable data={response?.disposals ?? []} columns={columns} isLoading={isPending} pageSize={20} emptyTitle="No disposal records yet" />
    </PageContainer>
  );
}
