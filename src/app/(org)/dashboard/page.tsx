"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Cell, Pie, PieChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClipboardCheck, FilePlus2, FileSpreadsheet, MapPin, Package, Upload } from "lucide-react";
import { getDashboard } from "@/api";
import { ConditionBar } from "@/components/global/condition-bar";
import { PageContainer } from "@/components/global/page-container";
import { StatCard } from "@/components/global/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/global/empty-state";
import { Button } from "@/components/ui/button";

const conditionColors = {
  good: "var(--color-status-good)",
  fair: "var(--color-status-fair)",
  bad: "var(--color-status-bad)",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

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

  if (!data || data.totals.unitsTotal === 0) {
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

  const { totals, needsAttention, unitsByCategory, byLocation, recentActivity, lastImport, lastVerification, activeVerification } = data;
  const maxLocationCount = byLocation[0]?.asset_lines || 1;

  return (
    <PageContainer>
      <div className="mb-[22px]">
        <h1 className="mb-1 font-heading text-[27px] font-semibold tracking-tight">Good afternoon, Ama</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s where the register stands today.</p>
      </div>

      <div className="mb-[22px] grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard
          label="Asset lines"
          icon={<Package size={15} />}
          value={totals.assetLines.toLocaleString()}
          caption={`${totals.unitsTotal.toLocaleString()} units`}
        />
        <StatCard label="Locations" icon={<MapPin size={15} />} value={totals.locations} />
        <StatCard
          label="Last import"
          icon={<Upload size={15} />}
          value={lastImport ? lastImport.imported_count.toLocaleString() : "—"}
          caption={lastImport ? `${lastImport.file_name} · ${formatDate(lastImport.completed_at)}` : "No imports yet"}
        />
        <StatCard label="Condition split">
          <ConditionBar good={totals.unitsGood} fair={totals.unitsFair} bad={totals.unitsBad} fullLabel />
        </StatCard>
        {activeVerification ? (
          <StatCard
            label="Verification in progress"
            icon={<ClipboardCheck size={15} />}
            value={`${activeVerification.counted}/${activeVerification.in_scope}`}
            caption={`Started ${formatDate(activeVerification.started_at)}`}
          />
        ) : lastVerification ? (
          <StatCard
            label="Last verification"
            icon={<ClipboardCheck size={15} />}
            value={formatDate(lastVerification.completed_at)}
            caption={`by ${lastVerification.completed_by_name}${lastVerification.discrepancies ? ` · ${lastVerification.discrepancies} discrepancies` : ""}`}
          />
        ) : (
          <StatCard label="Last verification" icon={<ClipboardCheck size={15} />} value="—" caption="No verification yet" />
        )}
      </div>

      <div className="mb-[22px] grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3.5 font-heading text-sm font-semibold">
            Condition distribution
          </div>
          <div className="min-w-0 px-5 py-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Good", key: "good", value: totals.unitsGood },
                    { name: "Fair", key: "fair", value: totals.unitsFair },
                    { name: "Bad", key: "bad", value: totals.unitsBad },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {(["good", "fair", "bad"] as const).map((key) => (
                    <Cell key={key} fill={conditionColors[key]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3.5 font-heading text-sm font-semibold">
            Units by category
          </div>
          <div className="px-2 py-4">
            {unitsByCategory.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No categories yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={unitsByCategory}>
                  <XAxis dataKey="category" fontSize={11} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} width={30} />
                  <Tooltip />
                  <Bar dataKey="unit_count" fill="#123C7A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <div className="font-heading text-[15px] font-semibold">Needs attention</div>
              <div className="mt-px text-xs text-muted-foreground">Locations with assets in bad condition</div>
            </div>
            <span className="rounded-full bg-[#F6E7E4] px-2.5 py-0.5 font-mono text-xs font-semibold text-status-bad">
              {totals.unitsBad} units
            </span>
          </div>
          {needsAttention.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Nothing needs attention right now.</div>
          ) : (
            needsAttention.map((row) => (
              <Link
                key={row.location_id}
                href={`/assets?location=${encodeURIComponent(row.location_id)}&condition=bad`}
                className="flex items-center justify-between border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-accent/30"
              >
                <div className="flex items-center gap-2.5">
                  <span className="size-2 flex-none rounded-full bg-status-bad" />
                  <div>
                    <div className="text-[13.5px] font-medium">{row.location_name}</div>
                    <div className="text-xs text-muted-foreground">{row.bad_count} units in bad condition</div>
                  </div>
                </div>
                <span className="font-mono text-[13px] font-semibold text-status-bad">{row.bad_count} →</span>
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
              {byLocation.map((loc) => (
                <div key={loc.id} className="flex items-center gap-2.5 py-1.5">
                  <span className="w-[88px] flex-none truncate text-[12.5px]">{loc.name}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <span
                      className="block h-full bg-[#123C7A]"
                      style={{ width: `${Math.round((loc.asset_lines / maxLocationCount) * 100)}%` }}
                    />
                  </span>
                  <span className="w-7 text-right font-mono text-xs text-muted-foreground">{loc.asset_lines}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3.5 font-heading text-sm font-semibold">
              Recent activity
            </div>
            {recentActivity.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No activity yet.</div>
            ) : (
              recentActivity.map((ev) => (
                <div key={ev.id} className="flex gap-2.5 border-b border-border px-5 py-3 last:border-b-0">
                  <div className="leading-snug">
                    <div className="text-[13px]">{ev.description}</div>
                    <div className="mt-px text-[11px] text-muted-foreground">
                      {ev.actor_name} · {formatDate(ev.occurred_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 font-heading text-sm font-semibold">Quick actions</div>
            <div className="flex flex-col gap-2">
              <Button asChild className="justify-start">
                <Link href="/assets/add">
                  <FilePlus2 /> Add asset
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href="/assets/upload">
                  <Upload /> Upload assets
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href="/verification/run">
                  <ClipboardCheck /> Start verification
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href="/reports">
                  <FileSpreadsheet /> View reports
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
