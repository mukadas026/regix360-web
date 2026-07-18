"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  client,
  downloadConditionByCategoryReport,
  downloadConditionByLocationReport,
  downloadRegisterReport,
  downloadVerificationReport,
} from "@/api";
import { PageContainer } from "@/components/global/page-container";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type VerificationCycle = {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  started_by_name: string;
  counted: number;
  discrepancies: number;
};

function useReportDownload(fn: () => Promise<void>, label: string) {
  return useMutation({
    mutationFn: fn,
    onError: () => toast.error(`${label} — download failed`),
  });
}

export default function ReportsPage() {
  const [cycleId, setCycleId] = useState<string>("");

  const { data: cyclesData, isPending: cyclesPending } = useQuery({
    queryKey: ["verificationCyclesForReports"],
    queryFn: async () => {
      const res = await client.get<{ cycles: VerificationCycle[] }>("/api/verification");
      return res.data.cycles;
    },
  });
  const cycles = cyclesData ?? [];

  const register = useReportDownload(() => downloadRegisterReport.fn(), "Asset register");
  const conditionByLocation = useReportDownload(
    () => downloadConditionByLocationReport.fn(),
    "Condition by location",
  );
  const conditionByCategory = useReportDownload(
    () => downloadConditionByCategoryReport.fn(),
    "Condition by category",
  );
  const verification = useReportDownload(
    () => downloadVerificationReport.fn(cycleId),
    "Verification report",
  );

  return (
    <PageContainer>
      <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">Reports</h1>
      <p className="mb-5 text-[13.5px] text-muted-foreground">
        Export to Excel for your auditor. PDF exports are coming soon.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card px-5 py-[18px]">
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="text-base text-[#123C7A]">📋</span>
            <span className="font-heading text-[15px] font-semibold">Asset register</span>
          </div>
          <p className="mb-3.5 text-[13px] text-muted-foreground">
            Full list, filterable — the canonical export.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={register.isPending}
              onClick={() => register.mutate()}
            >
              {register.isPending ? "Exporting…" : "Excel"}
            </Button>
            <Button variant="outline" size="sm" disabled>
              PDF
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card px-5 py-[18px]">
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="text-base text-[#123C7A]">📍</span>
            <span className="font-heading text-[15px] font-semibold">Condition by location</span>
          </div>
          <p className="mb-3.5 text-[13px] text-muted-foreground">
            Good/fair/bad split for every location.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={conditionByLocation.isPending}
              onClick={() => conditionByLocation.mutate()}
            >
              {conditionByLocation.isPending ? "Exporting…" : "Excel"}
            </Button>
            <Button variant="outline" size="sm" disabled>
              PDF
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card px-5 py-[18px]">
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="text-base text-[#123C7A]">🗂</span>
            <span className="font-heading text-[15px] font-semibold">Condition by category</span>
          </div>
          <p className="mb-3.5 text-[13px] text-muted-foreground">
            Good/fair/bad split for every category.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={conditionByCategory.isPending}
              onClick={() => conditionByCategory.mutate()}
            >
              {conditionByCategory.isPending ? "Exporting…" : "Excel"}
            </Button>
            <Button variant="outline" size="sm" disabled>
              PDF
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card px-5 py-[18px]">
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="text-base text-[#123C7A]">✓</span>
            <span className="font-heading text-[15px] font-semibold">Verification report</span>
          </div>
          <p className="mb-3.5 text-[13px] text-muted-foreground">
            Pick a past cycle and export its diff.
          </p>
          <div className="mb-3">
            <Select value={cycleId} onValueChange={setCycleId} disabled={cyclesPending || cycles.length === 0}>
              <SelectTrigger className="h-8 text-[13px]">
                <SelectValue
                  placeholder={cyclesPending ? "Loading cycles…" : cycles.length === 0 ? "No past cycles" : "Select a cycle"}
                />
              </SelectTrigger>
              <SelectContent>
                {cycles.map((cycle) => (
                  <SelectItem key={cycle.id} value={cycle.id}>
                    {new Date(cycle.started_at).toLocaleDateString()} — {cycle.status} ({cycle.discrepancies} discrepancies)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!cycleId || verification.isPending}
              onClick={() => verification.mutate()}
            >
              {verification.isPending ? "Exporting…" : "Excel"}
            </Button>
            <Button variant="outline" size="sm" disabled>
              PDF
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
