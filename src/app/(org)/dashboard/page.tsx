"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getDashboard } from "@/api";
import { ConditionBar } from "@/components/global/condition-bar";
import { PageContainer } from "@/components/global/page-container";
import { StatCard } from "@/components/global/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/global/empty-state";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data, isPending } = useQuery({
    queryKey: getDashboard.key,
    queryFn: () => getDashboard.fn(),
  });

  if (isPending) {
    return (
      <PageContainer>
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="mb-6 h-4 w-80" />
        <div className="mb-6 grid grid-cols-2 gap-3.5 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!data || data.kpi.assets === 0) {
    return (
      <PageContainer>
        <EmptyState
          title="Your register is empty"
          description="Upload your assets to get started."
          action={
            <div className="flex justify-center gap-2">
              <Button asChild>
                <Link href="/assets/upload">Upload assets</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/assets/add">or add one manually</Link>
              </Button>
            </div>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-[22px]">
        <h1 className="mb-1 font-heading text-[27px] font-semibold tracking-tight">Good afternoon, Ama</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s where the register stands today.</p>
      </div>

      <div className="mb-[22px] grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total assets" value={data.kpi.assets.toLocaleString()} />
        <StatCard label="Locations" value={data.kpi.locations} />
        <StatCard label="Condition split">
          <ConditionBar good={data.kpi.good} fair={data.kpi.fair} bad={data.kpi.bad} fullLabel />
        </StatCard>
        <StatCard label="Last verification" value="14 Mar 2025" caption="by Ama Mensah" />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <div className="font-heading text-[15px] font-semibold">Needs attention</div>
              <div className="mt-px text-xs text-muted-foreground">Assets in bad condition, by location</div>
            </div>
            <span className="rounded-full bg-[#F6E7E4] px-2.5 py-0.5 font-mono text-xs font-semibold text-status-bad">
              {data.kpi.bad} units
            </span>
          </div>
          {data.attention.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Nothing needs attention right now.</div>
          ) : (
            data.attention.map((row) => (
              <Link
                key={row.locName}
                href={`/assets?location=${encodeURIComponent(row.locName)}&condition=bad`}
                className="flex items-center justify-between border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-accent/30"
              >
                <div className="flex items-center gap-2.5">
                  <span className="size-2 flex-none rounded-full bg-status-bad" />
                  <div>
                    <div className="text-[13.5px] font-medium">{row.locName}</div>
                    <div className="text-xs text-muted-foreground">{row.detail}</div>
                  </div>
                </div>
                <span className="font-mono text-[13px] font-semibold text-status-bad">{row.count} →</span>
              </Link>
            ))
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3.5 font-heading text-sm font-semibold">
              Assets by location
            </div>
            <div className="px-5 pt-2 pb-3.5">
              {data.byLocation.map((loc) => (
                <div key={loc.name} className="flex items-center gap-2.5 py-1.5">
                  <span className="w-[88px] flex-none text-[12.5px]">{loc.name}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <span className="block h-full bg-[#123C7A]" style={{ width: loc.pct }} />
                  </span>
                  <span className="w-7 text-right font-mono text-xs text-muted-foreground">{loc.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3.5 font-heading text-sm font-semibold">
              Recent activity
            </div>
            {data.activity.map((ev, i) => (
              <div key={i} className="flex gap-2.5 border-b border-border px-5 py-3 last:border-b-0">
                <span className="flex-none text-sm">{ev.icon}</span>
                <div className="leading-snug">
                  <div className="text-[13px]">{ev.text}</div>
                  <div className="mt-px text-[11px] text-muted-foreground">{ev.when}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
