"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { getVerificationReport } from "@/api";
import type { VerificationCycleStatus, VerificationReportRow } from "@/types/asset-platform";
import { AssetCodeChip } from "@/components/global/asset-code-chip";
import { DataTable } from "@/components/global/data-table";
import { PageContainer } from "@/components/global/page-container";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const statusVariant: Record<VerificationCycleStatus, "default" | "secondary" | "destructive"> = {
  in_progress: "default",
  completed: "secondary",
  abandoned: "destructive",
};

const conditionBadgeVariant: Record<string, "default" | "secondary" | "destructive"> = {
  good: "default",
  fair: "secondary",
  bad: "destructive",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VerificationReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: report, isPending } = useQuery({
    queryKey: getVerificationReport.key(id),
    queryFn: () => getVerificationReport.fn(id),
  });

  // Discrepancies first, per docs/api.md — the report endpoint already sorts
  // this way, but rows are re-sorted client side too since DataTable's own
  // sort state can reorder them once the user touches a column header.
  const sortedCounts = useMemo(() => {
    if (!report) return [];
    return [...report.counts].sort((a, b) => Number(b.discrepancy) - Number(a.discrepancy));
  }, [report]);

  const columns = useMemo<ColumnDef<VerificationReportRow>[]>(
    () => [
      {
        accessorKey: "description",
        header: "Asset",
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="text-[13.5px] font-medium">{row.original.description}</div>
            <AssetCodeChip code={row.original.code} className="text-[9px]" />
          </div>
        ),
      },
      { accessorKey: "location_name", header: "Location", cell: ({ row }) => <span className="text-[13px]">{row.original.location_name}</span> },
      {
        accessorKey: "prev_condition",
        header: "Before",
        cell: ({ row }) => <Badge variant={conditionBadgeVariant[row.original.prev_condition]}>{row.original.prev_condition}</Badge>,
      },
      {
        accessorKey: "counted_condition",
        header: "Counted",
        cell: ({ row }) =>
          row.original.reported_missing ? (
            <Badge variant="destructive">Missing</Badge>
          ) : row.original.counted_condition ? (
            <Badge variant={conditionBadgeVariant[row.original.counted_condition]}>{row.original.counted_condition}</Badge>
          ) : (
            <span className="text-[13px] text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "discrepancy",
        header: "Result",
        cell: ({ row }) =>
          row.original.discrepancy ? (
            <Badge variant="destructive">Discrepancy</Badge>
          ) : (
            <span className="text-[13px] text-muted-foreground">Matched</span>
          ),
        meta: {
          filter: {
            type: "select",
            options: [
              { label: "Discrepancy", value: "true" },
              { label: "Matched", value: "false" },
            ],
          },
        },
      },
      {
        accessorKey: "counted_by_name",
        header: "Counted by",
        cell: ({ row }) => (
          <div>
            <div className="text-[13px]">{row.original.counted_by_name}</div>
            <div className="text-[11.5px] text-muted-foreground">{formatDate(row.original.counted_at)}</div>
          </div>
        ),
      },
    ],
    [],
  );

  if (isPending) {
    return (
      <PageContainer>
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-80 w-full" />
      </PageContainer>
    );
  }

  if (!report) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">This verification cycle could not be found.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Link href="/verification" className="mb-3.5 inline-block text-[13px] font-semibold text-muted-foreground">
        ← Back to verification
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Verification report</h1>
          <p className="text-[13.5px] text-muted-foreground">
            Started by {report.cycle.started_by_name} on {formatDate(report.cycle.started_at)}
            {report.cycle.completed_at && <> · completed {formatDate(report.cycle.completed_at)}</>}
          </p>
        </div>
        <Badge variant={statusVariant[report.cycle.status]}>{report.cycle.status.replace("_", " ")}</Badge>
      </div>

      <DataTable
        data={sortedCounts}
        columns={columns}
        pageSize={20}
        emptyTitle="No units counted yet"
        className="mb-5"
      />

      {report.uncounted.length > 0 && (
        <div>
          <h2 className="mb-2 font-heading text-base font-semibold">Uncounted units ({report.uncounted.length})</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {report.uncounted.map((u, i) => (
              <div
                key={`${u.code}-${i}`}
                className="flex items-center justify-between gap-3 border-b border-border px-5 py-2.5 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium">{u.description}</div>
                  <AssetCodeChip code={u.code} className="text-[9px]" />
                </div>
                <span className="text-[13px] text-muted-foreground">{u.location_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
