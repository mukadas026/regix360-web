"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { addLocation, deleteLocation, getLocations, updateLocation } from "@/api";
import type { ApiError } from "@/api";
import type { Location } from "@/types/asset-platform";
import { DataTable, createSortableHeader } from "@/components/global/data-table";
import { PageContainer } from "@/components/global/page-container";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");

  const [editing, setEditing] = useState<Location | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: addLocation.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getLocations.key });
      toast("Location added");
      setOpen(false);
      setName("");
      setCode("");
      setAddress("");
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not add location."),
  });

  const { mutate: saveEdit, isPending: isEditSaving } = useMutation({
    mutationFn: updateLocation.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getLocations.key });
      toast("Location updated");
      setEditing(null);
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not update location."),
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteLocation.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getLocations.key });
      toast("Location deleted");
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not delete location."),
  });

  const columns = useMemo<ColumnDef<Location>[]>(
    () => [
      { accessorKey: "name", header: createSortableHeader("Location"), cell: ({ row }) => <span className="text-[13.5px] font-medium">{row.original.name}</span> },
      { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-mono text-[12.5px]">{row.original.code}</span> },
      { accessorKey: "address", header: "Address", cell: ({ row }) => <span className="text-[13px] text-muted-foreground">{row.original.address ?? "—"}</span> },
      {
        accessorKey: "total_units",
        header: () => <div className="text-right">Assets</div>,
        cell: ({ row }) => <div className="text-right font-mono text-[13px]">{row.original.total_units}</div>,
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => <span className="font-mono text-[12.5px] text-muted-foreground">{row.original.created_at}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          canEdit ? (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(row.original);
                  setEditName(row.original.name);
                  setEditAddress(row.original.address ?? "");
                }}
                className="text-muted-foreground/50 hover:text-foreground"
              >
                <Pencil size={15} />
              </button>
              <DeleteLocationButton location={row.original} onConfirm={() => remove(row.original.id)} />
            </div>
          ) : null,
      },
    ],
    [canEdit, remove],
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
                    Code <span className="font-normal text-muted-foreground">— 2-6 letters/numbers, permanent</span>
                  </Label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. AGB"
                    maxLength={6}
                  />
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
                  disabled={!name || !code || isSaving}
                  onClick={() => mutate({ name, code, address: address || null })}
                >
                  Add location
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <DataTable data={locations ?? []} columns={columns} isLoading={isPending} pageSize={20} emptyTitle="No locations yet" />

      <Dialog open={editing !== null} onOpenChange={(next) => !next && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit location</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div>
              <Label className="mb-1.5 text-[12.5px] font-semibold">Location name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 text-[12.5px] font-semibold">
                Code <span className="font-normal text-muted-foreground">— permanent</span>
              </Label>
              <Input value={editing?.code ?? ""} disabled />
            </div>
            <div>
              <Label className="mb-1.5 text-[12.5px] font-semibold">Address</Label>
              <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!editName || isEditSaving}
              onClick={() => {
                if (!editing) return;
                saveEdit({ id: editing.id, name: editName, address: editAddress || null });
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function DeleteLocationButton({ location, onConfirm }: { location: Location; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="text-muted-foreground/50 hover:text-status-bad"
      >
        <Trash2 size={15} />
      </button>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {location.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This can&apos;t be undone. Locations holding asset lines can&apos;t be deleted — move them first.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
