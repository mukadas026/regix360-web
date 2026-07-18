"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { getActivityLog } from "@/api";
import type { ActivityLogEntry } from "@/types/asset-platform";
import { DataTable, createSortableHeader } from "@/components/global/data-table";
import { PageContainer } from "@/components/global/page-container";

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActivityLogsPage() {
  const { data: entries, isPending } = useQuery({ queryKey: getActivityLog.key, queryFn: () => getActivityLog.fn() });

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return entries ?? [];
    return (entries ?? []).filter((e) => e.description.toLowerCase().includes(search.toLowerCase()));
  }, [entries, search]);

  const actionOptions = useMemo(
    () => Array.from(new Set((entries ?? []).map((e) => e.action))).map((a) => ({ label: a, value: a })),
    [entries],
  );

  const targetTypeOptions = useMemo(
    () => Array.from(new Set((entries ?? []).map((e) => e.target_type))).map((t) => ({ label: t, value: t })),
    [entries],
  );

  const columns = useMemo<ColumnDef<ActivityLogEntry>[]>(
    () => [
      {
        accessorKey: "occurred_at",
        header: createSortableHeader("Timestamp"),
        cell: ({ row }) => <span className="text-[12.5px] text-muted-foreground">{formatTimestamp(row.original.occurred_at)}</span>,
      },
      {
        accessorKey: "actor_name",
        header: "User",
        cell: ({ row }) => <span className="text-[13.5px] font-medium">{row.original.actor_name}</span>,
      },
      {
        accessorKey: "action",
        header: "Action",
        meta: { filter: { type: "select", options: actionOptions } },
        cell: ({ row }) => <span className="font-mono text-[12.5px]">{row.original.action}</span>,
      },
      {
        accessorKey: "target_type",
        header: "Target Type",
        meta: { filter: { type: "select", options: targetTypeOptions } },
        cell: ({ row }) => <span className="text-[13px] capitalize">{row.original.target_type}</span>,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => <span className="text-[13px] text-muted-foreground">{row.original.description}</span>,
      },
    ],
    [actionOptions, targetTypeOptions],
  );

  return (
    <PageContainer>
      <div className="mb-[18px]">
        <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Activity Logs</h1>
        <p className="text-sm text-muted-foreground">View all activity across your organization</p>
      </div>

      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <div className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-card px-2.5 sm:w-[280px]">
          <span className="text-sm text-muted-foreground">⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities..."
            className="flex-1 border-none bg-transparent text-[13.5px] outline-none"
          />
        </div>
      </div>

      <DataTable data={filtered} columns={columns} isLoading={isPending} pageSize={20} emptyTitle="No activity yet" />
    </PageContainer>
  );
}
