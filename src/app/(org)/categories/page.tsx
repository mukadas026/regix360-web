"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { addCategory, deleteCategory, getCategories, updateCategory } from "@/api";
import type { ApiError } from "@/api";
import type { CategoryOption } from "@/types/asset-platform";
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

export default function CategoriesPage() {
  const { canEdit } = useSession();
  const queryClient = useQueryClient();
  const { data: categories, isPending } = useQuery({
    queryKey: getCategories.key(""),
    queryFn: () => getCategories.fn(""),
  });

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const [editing, setEditing] = useState<CategoryOption | null>(null);
  const [editName, setEditName] = useState("");

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: addCategory.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast("Category added");
      setOpen(false);
      setName("");
      setCode("");
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not add category."),
  });

  const { mutate: saveEdit, isPending: isEditSaving } = useMutation({
    mutationFn: updateCategory.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast("Category updated");
      setEditing(null);
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not update category."),
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteCategory.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast("Category deleted");
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not delete category."),
  });

  const filtered = useMemo(
    () => (categories ?? []).filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase())),
    [categories, search],
  );

  const columns = useMemo<ColumnDef<CategoryOption>[]>(
    () => [
      { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-mono text-[12.5px]">{row.original.code}</span> },
      {
        accessorKey: "name",
        header: createSortableHeader("Name"),
        cell: ({ row }) => <span className="text-[13.5px] font-medium">{row.original.name}</span>,
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
              <DeleteCategoryButton category={row.original} onConfirm={() => remove(row.original.id)} />
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
          <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">Manage your organization&apos;s category dictionary</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add category</DialogTitle>
              </DialogHeader>
              <div className="space-y-3.5">
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Electricals" />
                </div>
                <div>
                  <Label className="mb-1.5 text-[12.5px] font-semibold">
                    Code <span className="font-normal text-muted-foreground">— 2-6 letters/numbers, permanent</span>
                  </Label>
                  <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. ELEC" maxLength={6} />
                </div>
              </div>
              <DialogFooter>
                <Button disabled={!name || !code || isSaving} onClick={() => mutate({ name, code })}>
                  Add category
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
            placeholder="Search categories..."
            className="flex-1 border-none bg-transparent text-[13.5px] outline-none"
          />
        </div>
      </div>

      <DataTable data={filtered} columns={columns} isLoading={isPending} pageSize={20} emptyTitle="No categories yet" />

      <Dialog open={editing !== null} onOpenChange={(next) => !next && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
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

function DeleteCategoryButton({ category, onConfirm }: { category: CategoryOption; onConfirm: () => void }) {
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
          <AlertDialogTitle>Delete {category.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This can&apos;t be undone. Categories used by assets can&apos;t be deleted — reassign them first.
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
