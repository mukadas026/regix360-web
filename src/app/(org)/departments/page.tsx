"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { addDepartment, deleteDepartment, getDepartments, getLocations, updateDepartment } from "@/api";
import type { ApiError } from "@/api";
import type { Department } from "@/types/asset-platform";
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

export default function DepartmentsPage() {
  const { canEdit } = useSession();
  const queryClient = useQueryClient();
  const { data: departments, isPending } = useQuery({ queryKey: getDepartments.key(), queryFn: () => getDepartments.fn() });
  const { data: locations } = useQuery({ queryKey: getLocations.key, queryFn: getLocations.fn });

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [locationId, setLocationId] = useState("");

  const [editing, setEditing] = useState<Department | null>(null);
  const [editName, setEditName] = useState("");

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: addDepartment.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getDepartments.key() });
      toast("Department added");
      setOpen(false);
      setName("");
      setCode("");
      setLocationId("");
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not add department."),
  });

  const { mutate: saveEdit, isPending: isEditSaving } = useMutation({
    mutationFn: updateDepartment.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getDepartments.key() });
      toast("Department updated");
      setEditing(null);
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not update department."),
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteDepartment.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getDepartments.key() });
      toast("Department deleted");
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not delete department."),
  });

  const filtered = useMemo(
    () => (departments ?? []).filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase())),
    [departments, search],
  );

  const locationOptions = useMemo(
    () => Array.from(new Set((departments ?? []).map((d) => d.location_name))).map((name) => ({ label: name, value: name })),
    [departments],
  );

  const columns = useMemo<ColumnDef<Department>[]>(
    () => [
      { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-mono text-[12.5px]">{row.original.code}</span> },
      { accessorKey: "name", header: createSortableHeader("Name"), cell: ({ row }) => <span className="text-[13.5px] font-medium">{row.original.name}</span> },
      {
        accessorKey: "location_name",
        header: "Location",
        meta: { filter: { type: "select", options: locationOptions } },
        cell: ({ row }) => <span className="text-[13px] text-muted-foreground">{row.original.location_name}</span>,
      },
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
                }}
                className="text-muted-foreground/50 hover:text-foreground"
              >
                <Pencil size={15} />
              </button>
              <DeleteDepartmentButton department={row.original} onConfirm={() => remove(row.original.id)} />
            </div>
          ) : null,
      },
    ],
    [canEdit, locationOptions, remove],
  );

  return (
    <PageContainer>
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Departments</h1>
          <p className="text-sm text-muted-foreground">Manage departments within each location</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add department</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add department</DialogTitle>
              </DialogHeader>
              <div className="space-y-3.5">
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Location</Label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
                  >
                    <option value="">Select location</option>
                    {locations?.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Media & Sound" />
                </div>
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">
                    Code <span className="font-normal text-muted-foreground">— 2-6 letters/numbers, permanent</span>
                  </Label>
                  <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. MED" maxLength={6} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={!name || !code || !locationId || isSaving}
                  onClick={() => mutate({ name, code, locationId })}
                >
                  Add department
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
            placeholder="Search departments..."
            className="flex-1 border-none bg-transparent text-[13.5px] outline-none"
          />
        </div>
      </div>

      <DataTable data={filtered} columns={columns} isLoading={isPending} pageSize={20} emptyTitle="No departments yet" />

      <Dialog open={editing !== null} onOpenChange={(next) => !next && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit department</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div>
              <Label className="mb-1.5 text-[12.5px] font-semibold">Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 text-[12.5px] font-semibold">
                Code <span className="font-normal text-muted-foreground">— permanent</span>
              </Label>
              <Input value={editing?.code ?? ""} disabled />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!editName || isEditSaving}
              onClick={() => {
                if (!editing) return;
                saveEdit({ id: editing.id, name: editName });
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

function DeleteDepartmentButton({ department, onConfirm }: { department: Department; onConfirm: () => void }) {
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
          <AlertDialogTitle>Delete {department.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This can&apos;t be undone. Departments holding asset lines can&apos;t be deleted — move them first.
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
