"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Layers, Printer } from "lucide-react";
import { toast } from "react-hot-toast";
import { client } from "@/api/client";
import { getAssets, getAssetUnits, getCategories, getLocations } from "@/api";
import type { AssetFilters, AssetSort, AssetUnitsQuery } from "@/api/assets";
import type { AssetGroup, AssetUnit, Condition, Department } from "@/types/asset-platform";
import { ConditionBar } from "@/components/global/condition-bar";
import { DataTable } from "@/components/global/data-table";
import { AssetDetailSheet } from "@/components/global/asset-detail-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContextMenuItem } from "@/components/ui/context-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/providers/session-provider";

const conditionBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  good: "default",
  fair: "secondary",
  bad: "destructive",
};

function groupKey(group: AssetGroup): AssetUnitsQuery {
  return {
    description: group.description,
    categoryItemId: group.category_item_id,
    locationId: group.location_id,
    departmentId: group.department_id,
  };
}

function UnitsDrawer({ group, onClose, onSelectUnit }: { group: AssetGroup | null; onClose: () => void; onSelectUnit: (id: string) => void }) {
  const query = group ? groupKey(group) : null;
  const { data: units, isPending } = useQuery({
    queryKey: getAssetUnits.key(query ?? { description: "", categoryItemId: "", locationId: "", departmentId: "" }),
    queryFn: () => getAssetUnits.fn(query as AssetUnitsQuery),
    enabled: Boolean(query),
  });

  return (
    <Sheet open={Boolean(group)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[440px] max-w-[92vw] gap-0 p-0 sm:max-w-[92vw]">
        <SheetHeader className="flex-none gap-1 border-b border-border px-[22px] py-5">
          <SheetTitle className="font-heading text-lg font-semibold tracking-tight">{group?.description}</SheetTitle>
          <p className="text-[13px] text-muted-foreground">
            {group?.location_name} · {group?.department_name}
          </p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-[22px]">
          {isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          ) : !units || units.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No units found for this group.</p>
          ) : (
            <div className="space-y-2">
              {units.map((unit: AssetUnit) => (
                <button
                  key={unit.id}
                  onClick={() => onSelectUnit(unit.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-border px-3.5 py-2.5 text-left hover:bg-accent/30"
                >
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[12.5px] font-medium">{unit.code}</div>
                    <div className="mt-0.5 text-[11.5px] text-muted-foreground capitalize">{unit.status.replace("_", " ")}</div>
                  </div>
                  <Badge variant={conditionBadgeVariant[unit.condition]} className="capitalize">
                    {unit.condition}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RegisterContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { canEdit } = useSession();
  const [resolving, setResolving] = useState(false);

  const search = searchParams.get("search") ?? "";
  const locationId = searchParams.get("location") ?? "";
  const departmentId = searchParams.get("department") ?? "";
  const categoryItemId = searchParams.get("category") ?? "";
  const condition = searchParams.get("condition") ?? "";
  const sort = (searchParams.get("sort") as AssetSort) || "updated";
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const activeAssetId = searchParams.get("asset");

  const activeGroupDesc = searchParams.get("gd");
  const activeGroupCat = searchParams.get("gc");
  const activeGroupLoc = searchParams.get("gl");
  const activeGroupDept = searchParams.get("gp");

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

  const activeGroup = useMemo<AssetGroup | null>(() => {
    if (!activeGroupDesc || !activeGroupCat || !activeGroupLoc || !activeGroupDept || !data) return null;
    return (
      data.groups.find(
        (g) =>
          g.description === activeGroupDesc &&
          g.category_item_id === activeGroupCat &&
          g.location_id === activeGroupLoc &&
          g.department_id === activeGroupDept,
      ) ?? {
        description: activeGroupDesc,
        category_item_id: activeGroupCat,
        category: "",
        item_code: "",
        location_id: activeGroupLoc,
        location_name: "",
        department_id: activeGroupDept,
        department_name: "",
        unit_count: 0,
        good_count: 0,
        fair_count: 0,
        bad_count: 0,
        updated_at: "",
      }
    );
  }, [activeGroupDesc, activeGroupCat, activeGroupLoc, activeGroupDept, data]);

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

  function openAsset(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("asset", id);
    params.delete("gd");
    params.delete("gc");
    params.delete("gl");
    params.delete("gp");
    router.push(`/assets?${params.toString()}`);
  }

  function closeAsset() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("asset");
    router.push(`/assets?${params.toString()}`);
  }

  function openGroupDrawer(group: AssetGroup) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("gd", group.description);
    params.set("gc", group.category_item_id);
    params.set("gl", group.location_id);
    params.set("gp", group.department_id);
    router.push(`/assets?${params.toString()}`);
  }

  function closeGroupDrawer() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("gd");
    params.delete("gc");
    params.delete("gl");
    params.delete("gp");
    router.push(`/assets?${params.toString()}`);
  }

  async function handleRowClick(group: AssetGroup) {
    if (resolving) return;
    if (group.unit_count === 1) {
      setResolving(true);
      try {
        const units = await queryClient.fetchQuery({
          queryKey: getAssetUnits.key(groupKey(group)),
          queryFn: () => getAssetUnits.fn(groupKey(group)),
        });
        if (units && units[0]) {
          openAsset(units[0].id);
          return;
        }
      } catch {
        toast("Couldn't load this asset — try again.");
      } finally {
        setResolving(false);
      }
    }
    openGroupDrawer(group);
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
              handleRowClick(row.original);
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
                {c.item_description}
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
          onRowClick={handleRowClick}
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
              <ContextMenuItem onClick={() => handleRowClick(group)}>
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

      <UnitsDrawer group={activeGroup} onClose={closeGroupDrawer} onSelectUnit={openAsset} />
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
