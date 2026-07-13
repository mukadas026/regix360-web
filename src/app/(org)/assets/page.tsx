"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { getAssets, getLocations } from "@/api";
import type { AssetFilters } from "@/api/assets";
import type { Asset } from "@/types/asset-platform";
import { AssetCodeChip } from "@/components/global/asset-code-chip";
import { ConditionBar } from "@/components/global/condition-bar";
import { DataTable, createSortableHeader } from "@/components/global/data-table";
import { AssetDetailSheet } from "@/components/global/asset-detail-sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@/providers/session-provider";
import { mockAssets } from "@/lib/mock-data";

const categories = Array.from(new Set(mockAssets.map((a) => a.category)));

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canEdit } = useSession();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const search = searchParams.get("search") ?? "";
  const locationId = searchParams.get("location") ?? "";
  const category = searchParams.get("category") ?? "";
  const condition = (searchParams.get("condition") as AssetFilters["condition"]) ?? undefined;
  const activeAssetId = searchParams.get("asset");

  const filters: AssetFilters = { search: search || undefined, locationId: locationId || undefined, category: category || undefined, condition };
  const filtersActive = Boolean(search || locationId || category || condition);

  const { data: locationsData } = useQuery({ queryKey: getLocations.key, queryFn: getLocations.fn });
  const { data, isPending } = useQuery({
    queryKey: getAssets.key(filters),
    queryFn: () => getAssets.fn(filters),
  });

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/assets?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/assets");
  }

  function openAsset(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("asset", id);
    router.push(`/assets?${params.toString()}`);
  }

  function closeAsset() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("asset");
    router.push(`/assets?${params.toString()}`);
  }

  const rows = data?.rows ?? [];
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }, [allSelected, rows]);

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const countText = useMemo(() => {
    if (!data) return "";
    return data.filteredTotal === data.total
      ? `${data.total.toLocaleString()} assets`
      : `${data.filteredTotal.toLocaleString()} of ${data.total.toLocaleString()} assets`;
  }, [data]);

  const columns = useMemo<ColumnDef<Asset>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} onClick={(e) => e.stopPropagation()} />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selected.has(row.original.id)}
            onCheckedChange={() => toggleRow(row.original.id)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      },
      {
        accessorKey: "description",
        header: createSortableHeader("Asset"),
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="mb-1 truncate text-[13.5px] font-medium">{row.original.description}</div>
            <AssetCodeChip code={row.original.code} className="text-[9.5px]" />
          </div>
        ),
      },
      {
        accessorKey: "locationName",
        header: createSortableHeader("Location"),
        cell: ({ row }) => <span className="text-[13px]">{row.original.locationName}</span>,
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {row.original.category}
          </span>
        ),
      },
      {
        id: "condition",
        header: "Condition",
        cell: ({ row }) => (
          <ConditionBar good={row.original.good} fair={row.original.fair} bad={row.original.bad} className="w-32" />
        ),
      },
      {
        id: "qty",
        header: () => <div className="text-right">Qty</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono text-[13px] font-medium">
            {row.original.good + row.original.fair + row.original.bad}
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: () => <div className="text-right">Updated</div>,
        cell: ({ row }) => <div className="text-right text-xs text-muted-foreground">{row.original.updatedAt}</div>,
      },
    ],
    [selected, allSelected, toggleAll],
  );

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex-none p-4 pb-0 sm:p-6 sm:pb-0 lg:p-8 lg:pb-0">
        <div className="mb-[18px] flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Asset register</h1>
            <p className="font-mono text-[13.5px] text-muted-foreground">{countText}</p>
          </div>
          {canEdit && (
            <div className="flex gap-2.5">
              <Button variant="outline" asChild>
                <Link href="/assets/add">Add asset</Link>
              </Button>
              <Button asChild>
                <Link href="/assets/upload">Upload assets</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
          <div className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-card px-2.5 sm:w-[280px]">
            <span className="text-sm text-muted-foreground">⌕</span>
            <input
              defaultValue={search}
              onChange={(e) => updateParam("search", e.target.value)}
              placeholder="Search name or code"
              className="flex-1 border-none bg-transparent text-[13.5px] outline-none"
            />
          </div>

          <select
            value={locationId}
            onChange={(e) => updateParam("location", e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-[13px] font-medium"
          >
            <option value="">All locations</option>
            {locationsData?.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => updateParam("category", e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-[13px] font-medium"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={condition ?? ""}
            onChange={(e) => updateParam("condition", e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-[13px] font-medium"
          >
            <option value="">All conditions</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="bad">Bad</option>
          </select>

          {filtersActive && (
            <button onClick={clearFilters} className="text-[13px] font-semibold text-accent-foreground">
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 pt-0 pb-[90px] sm:p-6 sm:pt-0 lg:p-8 lg:pt-0">
        <DataTable
          data={rows}
          columns={columns}
          isLoading={isPending}
          onRowClick={(row) => openAsset(row.id)}
          rowClassName={(row) => (selected.has(row.id) ? "bg-accent/30" : "")}
          pageSize={20}
          emptyTitle="No assets match these filters"
          emptyAction={
            <button onClick={clearFilters} className="text-sm font-semibold text-accent-foreground">
              Clear filters
            </button>
          }
        />
      </div>

      {selected.size > 0 && (
        <div className="absolute bottom-[22px] left-1/2 z-20 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-4 overflow-x-auto rounded-xl bg-foreground py-2.5 pr-3 pl-[18px] text-white shadow-lg">
          <span className="flex-none font-mono text-[13px]">{selected.size} selected</span>
          <div className="flex flex-none gap-1.5">
            {["Change condition", "Move to location", "Export selected"].map((label) => (
              <button
                key={label}
                onClick={() => toast(`${label} — not wired up yet`)}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-[13px] font-medium whitespace-nowrap"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => toast("Delete — not wired up yet")}
              className="rounded-lg bg-status-bad/90 px-3 py-1.5 text-[13px] font-medium whitespace-nowrap"
            >
              Delete
            </button>
          </div>
          <button onClick={() => setSelected(new Set())} className="flex-none px-1 text-lg text-muted-foreground">
            ×
          </button>
        </div>
      )}

      <AssetDetailSheet assetId={activeAssetId} onClose={closeAsset} />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
