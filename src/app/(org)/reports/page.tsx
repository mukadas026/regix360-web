"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { getConditionByLocation, reportDefinitions } from "@/api";
import { ConditionBar } from "@/components/global/condition-bar";
import { DataTable, createSortableHeader } from "@/components/global/data-table";
import { PageContainer } from "@/components/global/page-container";
import { Button } from "@/components/ui/button";

type ConditionRow = { name: string; g: number; f: number; b: number };

export default function ReportsPage() {
  const { data: condByLoc, isPending } = useQuery({
    queryKey: getConditionByLocation.key,
    queryFn: getConditionByLocation.fn,
  });

  const columns = useMemo<ColumnDef<ConditionRow>[]>(
    () => [
      { accessorKey: "name", header: createSortableHeader("Location") },
      {
        accessorKey: "g",
        header: () => <div className="text-right">Good</div>,
        cell: ({ row }) => <div className="text-right font-mono text-status-good">{row.original.g}</div>,
      },
      {
        accessorKey: "f",
        header: () => <div className="text-right">Fair</div>,
        cell: ({ row }) => <div className="text-right font-mono text-status-fair">{row.original.f}</div>,
      },
      {
        accessorKey: "b",
        header: () => <div className="text-right">Bad</div>,
        cell: ({ row }) => <div className="text-right font-mono text-status-bad">{row.original.b}</div>,
      },
      {
        id: "split",
        header: "Split",
        cell: ({ row }) => (
          <ConditionBar good={row.original.g} fair={row.original.f} bad={row.original.b} showLabel={false} className="w-[150px]" />
        ),
      },
    ],
    [],
  );

  return (
    <PageContainer>
      <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Reports</h1>
      <p className="mb-5 text-[13.5px] text-muted-foreground">
        Preview on screen, export to Excel or PDF for your auditor.
      </p>

      <div className="mb-[22px] grid grid-cols-1 gap-4 sm:grid-cols-2">
        {reportDefinitions.map((r) => (
          <div key={r.key} className="rounded-xl border border-border bg-card px-5 py-[18px]">
            <div className="mb-1.5 flex items-center gap-2.5">
              <span className="text-base text-[#123C7A]">{r.icon}</span>
              <span className="font-heading text-[15px] font-semibold">{r.title}</span>
            </div>
            <p className="mb-3.5 text-[13px] text-muted-foreground">{r.desc}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast(`${r.title} — Excel export not wired up yet`)}
              >
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast(`${r.title} — PDF export not wired up yet`)}>
                PDF
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3 font-heading text-[15px] font-semibold">
        Condition by location <span className="text-[13px] font-normal text-muted-foreground">— preview</span>
      </div>
      <DataTable data={condByLoc ?? []} columns={columns} isLoading={isPending} pageSize={20} />
    </PageContainer>
  );
}
