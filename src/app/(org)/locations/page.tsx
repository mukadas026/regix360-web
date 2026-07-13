"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addLocation, getAssets, getLocations } from "@/api";
import type { Location } from "@/types/asset-platform";
import { DataTable, createSortableHeader } from "@/components/global/data-table";
import { PageContainer } from "@/components/global/page-container";
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

export default function LocationsPage() {
  const { canEdit } = useSession();
  const queryClient = useQueryClient();
  const { data: locations, isPending } = useQuery({ queryKey: getLocations.key, queryFn: getLocations.fn });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: addLocation.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getLocations.key });
      toast("Location added");
      setOpen(false);
      setName("");
      setAddress("");
    },
  });

  const columns = useMemo<ColumnDef<Location>[]>(
    () => [
      { accessorKey: "name", header: createSortableHeader("Location"), cell: ({ row }) => <span className="text-[13.5px] font-medium">{row.original.name}</span> },
      { accessorKey: "address", header: "Address", cell: ({ row }) => <span className="text-[13px] text-muted-foreground">{row.original.address ?? "—"}</span> },
      {
        accessorKey: "assetCount",
        header: () => <div className="text-right">Assets</div>,
        cell: ({ row }) => <div className="text-right font-mono text-[13px]">{row.original.assetCount}</div>,
      },
      { accessorKey: "createdAt", header: "Created", cell: ({ row }) => <span className="font-mono text-[12.5px] text-muted-foreground">{row.original.createdAt}</span> },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <DeleteLocationButton locationId={row.original.id} disabled={!canEdit} />,
      },
    ],
    [canEdit],
  );

  return (
    <PageContainer>
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Locations</h1>
          <p className="font-mono text-[13.5px] text-muted-foreground">
            {locations ? `${locations.length} locations` : ""}
          </p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add location</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add location</DialogTitle>
              </DialogHeader>
              <div className="space-y-3.5">
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Location name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Agbogba" />
                </div>
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">
                    Address <span className="font-normal text-muted-foreground">— optional</span>
                  </Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Agbogba Junction, Accra" />
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={!name || isSaving}
                  onClick={() => mutate({ name, address: address || null })}
                >
                  Add location
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <DataTable data={locations ?? []} columns={columns} isLoading={isPending} pageSize={20} emptyTitle="No locations yet" />
    </PageContainer>
  );
}

function DeleteLocationButton({ locationId, disabled }: { locationId: string; disabled: boolean }) {
  const { data } = useQuery({
    queryKey: getAssets.key({ locationId }),
    queryFn: () => getAssets.fn({ locationId }),
  });

  if (disabled) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toast(
          data && data.filteredTotal > 0
            ? `This location has ${data.filteredTotal} assets. Move or delete them first.`
            : "Location deleted",
        );
      }}
      className="text-muted-foreground/50 hover:text-status-bad"
    >
      <Trash2 size={15} />
    </button>
  );
}
