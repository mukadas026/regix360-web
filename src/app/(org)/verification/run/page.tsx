"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "react-hot-toast";
import {
  abandonVerification,
  completeVerification,
  getActiveVerification,
  getLocations,
  getVerificationCycles,
  getVerificationScopeAssets,
  recordCount,
  startVerification,
} from "@/api";
import type { VerificationApiError, VerificationCompleteSummary, VerificationScopeFilters } from "@/api/verification";
import type { Condition, VerificationScopeAsset } from "@/types/asset-platform";
import { AssetCodeChip } from "@/components/global/asset-code-chip";
import { DataTable } from "@/components/global/data-table";
import { PageContainer } from "@/components/global/page-container";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";

const conditionBadgeVariant: Record<Condition, "default" | "secondary" | "destructive"> = {
  good: "default",
  fair: "secondary",
  bad: "destructive",
};

const conditions: Condition[] = ["good", "fair", "bad"];

function StartVerificationScreen() {
  const { canEdit } = useSession();
  const queryClient = useQueryClient();
  const { data: locations, isPending: isLocationsPending } = useQuery({ queryKey: getLocations.key, queryFn: getLocations.fn });

  const [scope, setScope] = useState<"all" | "specific">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { mutate: start, isPending: isStarting } = useMutation({
    mutationFn: startVerification.fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getActiveVerification.key });
      queryClient.invalidateQueries({ queryKey: getVerificationCycles.key });
      toast("Verification cycle started");
    },
    onError: (error: VerificationApiError) => {
      toast.error(error?.message ?? "Failed to start verification");
      if (error?.cycleId) {
        // Someone else started a cycle first — refetching /active flips this
        // screen straight into the counting view for that cycle below.
        queryClient.invalidateQueries({ queryKey: getActiveVerification.key });
      }
    },
  });

  function toggleLocation(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  if (!canEdit) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Only asset managers and org admins can start a verification cycle.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Link href="/verification" className="mb-3.5 inline-block text-[13px] font-semibold text-muted-foreground">
        ← Cancel verification
      </Link>
      <h1 className="mb-1.5 font-heading text-2xl font-semibold tracking-tight">Start verification</h1>
      <p className="mb-5 text-sm text-muted-foreground">Choose which locations to count.</p>

      <div className="rounded-lg border border-border bg-card p-6">
        <RadioGroup value={scope} onValueChange={(v) => setScope(v as "all" | "specific")}>
          <div className="flex items-center gap-2.5 py-1.5">
            <RadioGroupItem value="all" id="scope-all" />
            <Label htmlFor="scope-all" className="text-sm font-normal">
              All locations
            </Label>
          </div>
          <div className="flex items-center gap-2.5 py-1.5">
            <RadioGroupItem value="specific" id="scope-specific" />
            <Label htmlFor="scope-specific" className="text-sm font-normal">
              Specific locations
            </Label>
          </div>
        </RadioGroup>

        {scope === "specific" && (
          <div className="mt-3 space-y-1 border-t border-border pt-3">
            {isLocationsPending ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              locations?.map((loc) => (
                <label key={loc.id} className="flex items-center gap-2.5 py-1 text-sm">
                  <Checkbox checked={selectedIds.includes(loc.id)} onCheckedChange={() => toggleLocation(loc.id)} />
                  {loc.name}
                </label>
              ))
            )}
          </div>
        )}
      </div>

      <Button
        className="mt-4 w-full"
        disabled={(scope === "specific" && selectedIds.length === 0) || isStarting}
        onClick={() => start({ locationIds: scope === "all" ? undefined : selectedIds })}
      >
        {isStarting ? "Starting…" : "Start verification"}
      </Button>
    </PageContainer>
  );
}

function ResultBadge({ asset }: { asset: VerificationScopeAsset }) {
  if (asset.found === null) return <span className="text-[13px] text-muted-foreground">Not counted</span>;
  if (asset.found === false) return <Badge variant="destructive">Missing</Badge>;
  return <Badge variant={conditionBadgeVariant[asset.counted_condition ?? "good"]}>{asset.counted_condition}</Badge>;
}

function CountingScreen({ cycleId }: { cycleId: string }) {
  const { canEdit } = useSession();
  const queryClient = useQueryClient();
  const { data: active } = useQuery({ queryKey: getActiveVerification.key, queryFn: getActiveVerification.fn });

  const [locationFilter, setLocationFilter] = useState("");
  const [countedFilter, setCountedFilter] = useState<"all" | "counted" | "uncounted">("all");
  const [completion, setCompletion] = useState<VerificationCompleteSummary | null>(null);

  const scopeFilters: VerificationScopeFilters = {
    locationId: locationFilter || undefined,
    counted: countedFilter === "all" ? undefined : countedFilter === "counted",
  };

  const { data: assets, isPending: isAssetsPending } = useQuery({
    queryKey: getVerificationScopeAssets.key(cycleId, scopeFilters),
    queryFn: () => getVerificationScopeAssets.fn(cycleId, scopeFilters),
  });

  const { mutate: count, isPending: isCounting, variables: countingVariables } = useMutation({
    mutationFn: recordCount.fn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["verification", cycleId, "assets"] });
      queryClient.invalidateQueries({ queryKey: getActiveVerification.key });
      if (data.discrepancy) toast("Discrepancy recorded");
    },
    onError: (error: VerificationApiError) => toast.error(error?.message ?? "Failed to record count"),
  });

  const { mutate: complete, isPending: isCompleting } = useMutation({
    mutationFn: () => completeVerification.fn(cycleId),
    onSuccess: (summary) => {
      setCompletion(summary);
      queryClient.invalidateQueries({ queryKey: getActiveVerification.key });
      queryClient.invalidateQueries({ queryKey: getVerificationCycles.key });
    },
    onError: (error: VerificationApiError) => toast.error(error?.message ?? "Failed to complete verification"),
  });

  const { mutate: abandon, isPending: isAbandoning } = useMutation({
    mutationFn: () => abandonVerification.fn(cycleId),
    onSuccess: () => {
      toast("Verification cycle abandoned");
      queryClient.invalidateQueries({ queryKey: getActiveVerification.key });
      queryClient.invalidateQueries({ queryKey: getVerificationCycles.key });
    },
    onError: (error: VerificationApiError) => toast.error(error?.message ?? "Failed to abandon verification"),
  });

  const columns = useMemo<ColumnDef<VerificationScopeAsset>[]>(
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
        accessorKey: "condition",
        header: "On record",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Badge variant={conditionBadgeVariant[row.original.condition]}>{row.original.condition}</Badge>
            {row.original.status === "missing" && <span className="text-[11.5px] text-muted-foreground">already missing</span>}
          </div>
        ),
      },
      {
        id: "result",
        header: "Counted",
        cell: ({ row }) => <ResultBadge asset={row.original} />,
        meta: {
          filter: {
            type: "select",
            options: [
              { label: "Counted", value: "counted" },
              { label: "Not counted", value: "uncounted" },
            ],
          },
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const asset = row.original;
          const isRowPending = isCounting && countingVariables?.assetId === asset.id;
          if (!canEdit) return null;
          return (
            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
              {conditions.map((condition) => {
                const isActive = asset.found === true && asset.counted_condition === condition;
                return (
                  <Button
                    key={condition}
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    disabled={isRowPending}
                    onClick={() => count({ cycleId, assetId: asset.id, found: true, condition })}
                    className="h-7 px-2 text-xs capitalize"
                  >
                    {condition}
                  </Button>
                );
              })}
              <Button
                size="sm"
                variant={asset.found === false ? "destructive" : "outline"}
                disabled={isRowPending}
                onClick={() => count({ cycleId, assetId: asset.id, found: false })}
                className="h-7 px-2 text-xs"
              >
                Missing
              </Button>
            </div>
          );
        },
      },
    ],
    [canEdit, count, countingVariables, cycleId, isCounting],
  );

  if (completion) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="mb-1 font-heading text-xl font-semibold">Verification complete</h1>
          <p className="mb-5 text-sm text-muted-foreground">The write-back has been applied to every counted unit.</p>
          <dl className="mb-6 grid grid-cols-2 gap-3 text-left">
            <SummaryStat label="In scope" value={completion.in_scope} />
            <SummaryStat label="Counted" value={completion.counted} />
            <SummaryStat label="Discrepancies" value={completion.discrepancies} highlight />
            <SummaryStat label="Reported missing" value={completion.reported_missing} highlight />
            <SummaryStat label="Uncounted" value={completion.uncounted} />
            <SummaryStat label="Units updated" value={completion.assetsUpdated} />
          </dl>
          <div className="flex justify-center gap-2.5">
            <Button variant="outline" asChild>
              <Link href={`/verification/${cycleId}/report`}>View report</Link>
            </Button>
            <Button asChild>
              <Link href="/verification">Done</Link>
            </Button>
          </div>
        </div>
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
          <h1 className="mb-1 font-heading text-xl font-semibold tracking-tight">Counting in progress</h1>
          <p className="text-[13.5px] text-muted-foreground">
            Started by {active?.cycle.started_by_name ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-[#CFE0F7] bg-accent px-3.5 py-2 text-right">
          <div className="font-mono text-sm font-semibold text-primary">
            {active?.progress.counted ?? 0} / {active?.progress.in_scope ?? 0} counted
          </div>
        </div>
      </div>

      {active && active.locations.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {active.locations.map((loc) => (
            <div key={loc.id} className="rounded-lg border border-border bg-card px-3 py-2">
              <div className="text-[12.5px] font-medium">{loc.name}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {loc.counted} / {loc.in_scope} counted
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-card px-2.5 text-[13px]"
          >
            <option value="">All locations</option>
            {active?.locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
            {(["all", "uncounted", "counted"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setCountedFilter(option)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[12.5px] font-medium capitalize",
                  countedFilter === option ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isAbandoning}>
                  Abandon
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Abandon this verification cycle?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All counts recorded so far are discarded and no assets are updated. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => abandon()}>Abandon cycle</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isCompleting}>Complete verification</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Complete this verification cycle?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Counted units are written back: found units are set to the condition you recorded, and
                    not-found units are marked missing. Uncounted units are left untouched.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => complete()}>Complete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <DataTable
        data={assets ?? []}
        columns={columns}
        isLoading={isAssetsPending}
        getRowId={(row) => row.id}
        pageSize={20}
        emptyTitle="No units match these filters"
      />
    </PageContainer>
  );
}

function SummaryStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">{label}</dt>
      <dd className={cn("font-mono text-lg font-semibold", highlight && value > 0 && "text-destructive")}>{value}</dd>
    </div>
  );
}

export default function RunVerificationPage() {
  const { data: active, isPending } = useQuery({ queryKey: getActiveVerification.key, queryFn: getActiveVerification.fn });

  if (isPending) {
    return (
      <PageContainer>
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-80 w-full" />
      </PageContainer>
    );
  }

  if (!active) return <StartVerificationScreen />;

  return <CountingScreen cycleId={active.cycle.id} />;
}
