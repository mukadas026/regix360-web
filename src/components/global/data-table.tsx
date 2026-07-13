"use client";

import { useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/global/empty-state";
import { cn } from "@/lib/utils";

export function createSortableHeader(label: string) {
  return function SortableHeader({ column }: { column: { toggleSorting: (desc: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) {
    return (
      <button
        type="button"
        className="flex items-center gap-1 text-inherit"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {label}
        {column.getIsSorted() === "asc" ? (
          <ChevronUp size={13} />
        ) : column.getIsSorted() === "desc" ? (
          <ChevronDown size={13} />
        ) : (
          <ChevronsUpDown size={13} className="opacity-40" />
        )}
      </button>
    );
  };
}

type DataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  pageSize?: number;
  className?: string;
};

export function DataTable<TData>({
  data,
  columns,
  isLoading = false,
  onRowClick,
  rowClassName,
  emptyTitle = "No results",
  emptyDescription,
  emptyAction,
  pageSize = 10,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const totalRows = data.length;
  const from = pagination.pageIndex * pagination.pageSize + 1;
  const to = Math.min(from + pagination.pageSize - 1, totalRows);

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : totalRows === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          className="rounded-none border-none"
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="h-11 px-5 text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase"
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      "border-b border-border last:border-b-0 hover:bg-accent/30",
                      onRowClick && "cursor-pointer",
                      rowClassName?.(row.original),
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-5 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalRows > pagination.pageSize && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <span className="font-mono text-xs text-muted-foreground">
                {from}–{to} of {totalRows}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft size={15} />
                </Button>
                <span className="px-1 font-mono text-xs text-muted-foreground">
                  {pagination.pageIndex + 1} / {table.getPageCount()}
                </span>
                <Button variant="ghost" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
