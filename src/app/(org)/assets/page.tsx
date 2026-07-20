"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Layers, Printer } from "lucide-react";
import { toast } from "react-hot-toast";
import { client } from "@/api/client";
import { getAssets, getCategories, getLocations } from "@/api";
import type { AssetFilters, AssetSort } from "@/api/assets";
import type { AssetGroup, Condition, Department } from "@/types/asset-platform";
import { ConditionBar } from "@/components/global/condition-bar";
import { DataTable } from "@/components/global/data-table";
import { Button } from "@/components/ui/button";
import { ContextMenuItem } from "@/components/ui/context-menu";
import { useSession } from "@/providers/session-provider";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canEdit } = useSession();

  const search = searchParams.get("search") ?? "";
  const locationId = searchParams.get("location") ?? "";
  const departmentId = searchParams.get("department") ?? "";
  const categoryItemId = searchParams.get("category") ?? "";
  const condition = searchParams.get("condition") ?? "";
  const sort = (searchParams.get("sort") as AssetSort) || "updated";
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const filters: AssetFilters = {
    search: search || undefined,
    locationIds: locationId ? [locationId] : undefined,
    departmentIds: departmentId ? [departmentId] : undefined,
    categoryIds: categoryItemId ? [categoryItemId] : undefined,
    conditions: condition ? [condition as Condition] : undefined,
    sort,
    page,
    pageSize: 50,
  };
  const filtersActive = Boolean(search || locationId || departmentId || categoryItemId || condition);

  const { data: locationsData } = useQuery({ queryKey: getLocations.key, queryFn: getLocations.fn });
  const { data: departmentsData } = useQuery({
    queryKey: ["departments", "all"],
    queryFn: async () => {
      const res = await client.get<{ departments: Department[] }>("/api/departments");
      return res.data.departments;
    },
  });
  const { data: categoriesData } = useQuery({ queryKey: getCategories.key(""), queryFn: () => getCategories.fn("") });
  const { data, isPending } = useQuery({
    queryKey: getAssets.key(filters),
    queryFn: () => getAssets.fn(filters),
  });

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`/assets?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/assets");
  }

  function openGroup(group: AssetGroup) {
    const params = new URLSearchParams({
      description: group.description,
      categoryItemId: group.category_item_id,
      locationId: group.location_id,
      departmentId: group.department_id,
      category: group.category,
      itemCode: group.item_code,
      locationName: group.location_name,
      departmentName: group.department_name,
    });
    router.push(`/assets/units?${params.toString()}`);
  }

  const rows = data?.groups ?? [];

  const countText = useMemo(() => {
    if (!data) return "";
    return data.filteredUnits === data.totalUnits
      ? `${data.totalUnits.toLocaleString()} units`
      : `${data.filteredUnits.toLocaleString()} of ${data.totalUnits.toLocaleString()} units`;
  }, [data]);

  const totalPages = data ? Math.max(1, Math.ceil(data.filteredGroups / data.pageSize)) : 1;

  const columns = useMemo<ColumnDef<AssetGroup, unknown>[]>(
    () => [
      {
        accessorKey: "description",
        header: "Asset",
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="mb-1 truncate text-[13.5px] font-medium">{row.original.description}</div>
            <span className="rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] tracking-[0.04em] text-muted-foreground">
              {row.original.item_code}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "location_name",
        header: "Location",
        cell: ({ row }) => <span className="text-[13px]">{row.original.location_name}</span>,
      },
      {
        accessorKey: "department_name",
        header: "Department",
        cell: ({ row }) => <span className="text-[13px]">{row.original.department_name}</span>,
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
          <ConditionBar
            good={row.original.good_count}
            fair={row.original.fair_count}
            bad={row.original.bad_count}
            className="w-32"
          />
        ),
      },
      {
        accessorKey: "unit_count",
        header: () => <div className="text-right">Units</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono text-[13px] font-medium">{row.original.unit_count}</div>
        ),
      },
      {
        accessorKey: "updated_at",
        header: () => <div className="text-right">Updated</div>,
        cell: ({ row }) => (
          <div className="text-right text-xs text-muted-foreground">
            {row.original.updated_at ? new Date(row.original.updated_at).toLocaleDateString() : "—"}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openGroup(row.original);
            }}
            title="View units"
            className="text-muted-foreground/50 hover:text-foreground"
          >
            <Layers size={15} />
          </button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
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
            value={departmentId}
            onChange={(e) => updateParam("department", e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-[13px] font-medium"
          >
            <option value="">All departments</option>
            {departmentsData?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <select
            value={categoryItemId}
            onChange={(e) => updateParam("category", e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-[13px] font-medium"
          >
            <option value="">All categories</option>
            {categoriesData?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={condition}
            onChange={(e) => updateParam("condition", e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-[13px] font-medium"
          >
            <option value="">All conditions</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="bad">Bad</option>
          </select>

          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-[13px] font-medium"
          >
            <option value="updated">Sort: recently updated</option>
            <option value="code">Sort: code</option>
            <option value="description">Sort: description</option>
            <option value="qty">Sort: quantity</option>
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
          onRowClick={openGroup}
          getRowId={(row) => `${row.description}::${row.category_item_id}::${row.location_id}::${row.department_id}`}
          pageSize={50}
          emptyTitle="No assets match these filters"
          emptyAction={
            <button onClick={clearFilters} className="text-sm font-semibold text-accent-foreground">
              Clear filters
            </button>
          }
          rowContextMenu={(group) => (
            <>
              <ContextMenuItem onClick={() => openGroup(group)}>
                <Eye /> View units
              </ContextMenuItem>
              <ContextMenuItem onClick={() => toast("Bulk label printing — not wired up yet")}>
                <Printer /> Print labels
              </ContextMenuItem>
            </>
          )}
        />

        {data && totalPages > 1 && (
          <div className="mt-3 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParam("page", String(page - 1))}
            >
              Previous
            </Button>
            <span className="font-mono text-xs text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateParam("page", String(page + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
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
