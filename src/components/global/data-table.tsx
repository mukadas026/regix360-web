"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/global/empty-state";
import { cn } from "@/lib/utils";

export type ColumnFilterConfig =
  | { type: "text"; placeholder?: string }
  | { type: "select"; options: { label: string; value: string }[] };

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    filter?: ColumnFilterConfig;
  }
}

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

function ColumnFilterButton({
  config,
  value,
  onChange,
}: {
  config: ColumnFilterConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(value);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex size-4 items-center justify-center rounded",
            value ? "text-primary" : "text-muted-foreground/50 hover:text-foreground",
          )}
        >
          <Filter size={12} className={value ? "fill-current" : ""} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56" onClick={(e) => e.stopPropagation()}>
        {config.type === "text" ? (
          <div className="space-y-2">
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onChange(draft);
                  setOpen(false);
                }
              }}
              placeholder={config.placeholder ?? "Filter..."}
              className="h-8 text-[13px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setDraft("");
                  onChange("");
                  setOpen(false);
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  onChange(draft);
                  setOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {config.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(value === opt.value ? "" : opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center rounded-md px-2 py-1.5 text-left text-[13px]",
                  value === opt.value ? "bg-accent font-medium text-accent-foreground" : "hover:bg-secondary",
                )}
              >
                {opt.label}
              </button>
            ))}
            {value && (
              <button
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="mt-1 flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-[12.5px] text-muted-foreground hover:bg-secondary"
              >
                <X size={11} /> Clear filter
              </button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
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
  pageSizeOptions?: number[];
  className?: string;
  getRowId?: (row: TData) => string;
  enableSelection?: boolean;
  bulkActions?: (selectedRows: TData[], clearSelection: () => void) => React.ReactNode;
  rowContextMenu?: (row: TData) => React.ReactNode;
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
  pageSizeOptions = [10, 20, 50, 100],
  className,
  getRowId,
  enableSelection = false,
  bulkActions,
  rowContextMenu,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });
  const [columnFilters, setColumnFilters] = useState<{ id: string; value: unknown }[]>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const resolvedColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
    if (!enableSelection) return columns;
    const selectColumn: ColumnDef<TData, unknown> = {
      id: "__select__",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(Boolean(v))}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    };
    return [selectColumn, ...columns];
  }, [columns, enableSelection]);

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    state: { sorting, pagination, columnFilters, rowSelection },
    getRowId,
    enableRowSelection: enableSelection,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const totalRows = table.getFilteredRowModel().rows.length;
  const from = pagination.pageIndex * pagination.pageSize + 1;
  const to = Math.min(from + pagination.pageSize - 1, totalRows);
  const activeFilterCount = columnFilters.filter((f) => f.value !== "" && f.value != null).length;
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-5 py-2 text-[12.5px]">
          <span className="font-medium text-muted-foreground">
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
          </span>
          <button
            onClick={() => table.resetColumnFilters()}
            className="flex items-center gap-1 font-semibold text-accent-foreground"
          >
            <X size={12} /> Clear all
          </button>
        </div>
      )}

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
          <div className="max-h-[70vh] overflow-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                      const filterConfig = header.column.columnDef.meta?.filter;
                      const filterValue = (header.column.getFilterValue() as string) ?? "";
                      return (
                        <TableHead
                          key={header.id}
                          className="sticky top-0 z-10 h-11 bg-card px-5 text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase"
                        >
                          {filterConfig ? (
                            // Only wrap in a flex row when a filter button needs to sit next to the
                            // label — the wrapper's flex item shrinks to content width, which would
                            // otherwise swallow a header's own text-right/text-center alignment and
                            // desync it from the matching (block-level, full-width) body cell.
                            <div className="flex items-center gap-1.5">
                              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                              <ColumnFilterButton
                                config={filterConfig}
                                value={filterValue}
                                onChange={(v) => header.column.setFilterValue(v || undefined)}
                              />
                            </div>
                          ) : header.isPlaceholder ? null : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const rowNode = (
                    <TableRow
                      key={row.id}
                      onClick={() => onRowClick?.(row.original)}
                      className={cn(
                        "border-b border-border last:border-b-0 hover:bg-accent/30",
                        onRowClick && "cursor-pointer",
                        row.getIsSelected() && "bg-accent/30",
                        rowClassName?.(row.original),
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-5 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );

                  if (!rowContextMenu) return rowNode;

                  return (
                    <ContextMenu key={row.id}>
                      <ContextMenuTrigger asChild>{rowNode}</ContextMenuTrigger>
                      <ContextMenuContent>{rowContextMenu(row.original)}</ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
            <span className="font-mono text-xs text-muted-foreground">
              {from}–{to} of {totalRows}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Rows</span>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => table.setPageSize(Number(e.target.value))}
                  className="h-7 rounded-md border border-input bg-card px-1.5 text-xs font-medium"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
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
          </div>
        </>
      )}

      {enableSelection && selectedRows.length > 0 && bulkActions && (
        <div className="fixed bottom-[22px] left-1/2 z-30 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-4 overflow-x-auto rounded-xl bg-foreground py-2.5 pr-3 pl-[18px] text-white shadow-lg">
          <span className="flex-none font-mono text-[13px]">{selectedRows.length} selected</span>
          <div className="flex flex-none items-center gap-1.5">
            {bulkActions(selectedRows, () => setRowSelection({}))}
          </div>
          <button onClick={() => setRowSelection({})} className="flex-none px-1 text-lg text-muted-foreground">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
