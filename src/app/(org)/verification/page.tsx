"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardCheck } from "lucide-react";
import { getActiveVerification, getVerificationCycles } from "@/api";
import type { VerificationCycle, VerificationCycleStatus } from "@/types/asset-platform";
import { DataTable, createSortableHeader } from "@/components/global/data-table";
import { PageContainer } from "@/components/global/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/providers/session-provider";

const statusVariant: Record<VerificationCycleStatus, "default" | "secondary" | "destructive"> = {
  in_progress: "default",
  completed: "secondary",
  abandoned: "destructive",
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

export default function VerificationPage() {
  const { canEdit } = useSession();
  const { data: cycles, isPending } = useQuery({
    queryKey: getVerificationCycles.key,
    queryFn: getVerificationCycles.fn,
  });
  const { data: active } = useQuery({
    queryKey: getActiveVerification.key,
    queryFn: getActiveVerification.fn,
  });

  const columns = useMemo<ColumnDef<VerificationCycle>[]>(
    () => [
      {
        accessorKey: "started_at",
        header: createSortableHeader("Started"),
        cell: ({ row }) => <span className="font-mono text-[13px] font-medium">{formatDate(row.original.started_at)}</span>,
      },
      { accessorKey: "started_by_name", header: "Started by", cell: ({ row }) => <span className="text-[13px]">{row.original.started_by_name}</span> },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status.replace("_", " ")}</Badge>,
        meta: {
          filter: {
            type: "select",
            options: [
              { label: "In progress", value: "in_progress" },
              { label: "Completed", value: "completed" },
              { label: "Abandoned", value: "abandoned" },
            ],
          },
        },
      },
      {
        accessorKey: "counted",
        header: () => <div className="text-right">Counted</div>,
        cell: ({ row }) => <div className="text-right font-mono text-[13px]">{row.original.counted}</div>,
      },
      {
        accessorKey: "discrepancies",
        header: () => <div className="text-right">Discrepancies</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono text-[13px] font-semibold text-primary">{row.original.discrepancies}</div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="text-right">
            <Link
              href={`/verification/${row.original.id}/report`}
              onClick={(e) => e.stopPropagation()}
              className="text-[13px] font-semibold text-accent-foreground"
            >
              View report →
            </Link>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <PageContainer>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Verification</h1>
          <p className="text-[13.5px] text-muted-foreground">
            Physical counts that write a snapshot to every asset&apos;s history.
          </p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href="/verification/run">{active ? "Continue verification" : "Start verification"}</Link>
          </Button>
        )}
      </div>

      {active && (
        <Link
          href="/verification/run"
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#CFE0F7] bg-accent px-4 py-3 text-accent-foreground transition hover:bg-accent/80"
        >
          <div className="flex items-center gap-2.5">
            <ClipboardCheck size={17} />
            <span className="text-[13.5px] font-medium">
              A verification cycle is in progress — started by {active.cycle.started_by_name}
            </span>
          </div>
          <span className="font-mono text-[13px] font-semibold">
            {active.progress.counted} / {active.progress.in_scope} counted
          </span>
        </Link>
      )}

      <DataTable data={cycles ?? []} columns={columns} isLoading={isPending} pageSize={20} emptyTitle="No verification cycles yet" />
    </PageContainer>
  );
}
