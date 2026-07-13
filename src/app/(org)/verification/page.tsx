"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { getVerificationCycles } from "@/api";
import type { VerificationCycle } from "@/types/asset-platform";
import { DataTable, createSortableHeader } from "@/components/global/data-table";
import { PageContainer } from "@/components/global/page-container";
import { Button } from "@/components/ui/button";
import { useSession } from "@/providers/session-provider";

export default function VerificationPage() {
  const { canEdit } = useSession();
  const { data: cycles, isPending } = useQuery({
    queryKey: getVerificationCycles.key,
    queryFn: getVerificationCycles.fn,
  });

  const columns = useMemo<ColumnDef<VerificationCycle>[]>(
    () => [
      { accessorKey: "date", header: createSortableHeader("Date"), cell: ({ row }) => <span className="font-mono text-[13px] font-medium">{row.original.date}</span> },
      { accessorKey: "runBy", header: "Run by", cell: ({ row }) => <span className="text-[13px]">{row.original.runBy}</span> },
      { accessorKey: "locationsLabel", header: "Scope", cell: ({ row }) => <span className="text-[13px] text-muted-foreground">{row.original.locationsLabel}</span> },
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
        cell: () => (
          <div className="text-right">
            <button className="text-[13px] font-semibold text-accent-foreground" onClick={(e) => e.stopPropagation()}>
              View report →
            </button>
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
            <Link href="/verification/run">Start verification</Link>
          </Button>
        )}
      </div>

      <DataTable data={cycles ?? []} columns={columns} isLoading={isPending} emptyTitle="No verification cycles yet" />
    </PageContainer>
  );
}
