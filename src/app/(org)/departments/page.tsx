"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { addDepartment, getDepartments, getLocations } from "@/api";
import type { Department } from "@/types/asset-platform";
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
import { useSession } from "@/providers/session-provider";

export default function DepartmentsPage() {
  const { canEdit } = useSession();
  const queryClient = useQueryClient();
  const { data: departments, isPending } = useQuery({ queryKey: getDepartments.key, queryFn: getDepartments.fn });
  const { data: locations } = useQuery({ queryKey: getLocations.key, queryFn: getLocations.fn });

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [locationId, setLocationId] = useState("");

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: addDepartment.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getDepartments.key });
      toast("Department added");
      setOpen(false);
      setName("");
      setCode("");
      setLocationId("");
    },
  });

  const filtered = useMemo(
    () => (departments ?? []).filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase())),
    [departments, search],
  );

  const locationOptions = useMemo(
    () => Array.from(new Set((departments ?? []).map((d) => d.locationName))).map((name) => ({ label: name, value: name })),
    [departments],
  );

  const columns = useMemo<ColumnDef<Department>[]>(
    () => [
      { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-mono text-[12.5px]">{row.original.code}</span> },
      { accessorKey: "name", header: createSortableHeader("Name"), cell: ({ row }) => <span className="text-[13.5px] font-medium">{row.original.name}</span> },
      {
        accessorKey: "locationName",
        header: "Location",
        meta: { filter: { type: "select", options: locationOptions } },
        cell: ({ row }) => <span className="text-[13px] text-muted-foreground">{row.original.locationName}</span>,
      },
      {
        accessorKey: "isActive",
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
          <Badge variant="secondary" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-status-good" />
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
    ],
    [locationOptions],
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
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Code</Label>
                  <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. MED" />
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
    </PageContainer>
  );
}
