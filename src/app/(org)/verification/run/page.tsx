"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getLocations, getVerifyRows } from "@/api";
import { AssetCodeChip } from "@/components/global/asset-code-chip";
import { PageContainer } from "@/components/global/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function RunVerificationPage() {
  const router = useRouter();
  const { data: locations } = useQuery({ queryKey: getLocations.key, queryFn: getLocations.fn });
  const [scope, setScope] = useState<string>("");
  const [started, setStarted] = useState(false);
  const [counts, setCounts] = useState<Record<string, { good: string; fair: string; bad: string }>>({});

  const { data: rows, isPending } = useQuery({
    queryKey: getVerifyRows.key(scope),
    queryFn: () => getVerifyRows.fn(scope),
    enabled: started && Boolean(scope),
  });

  const location = locations?.find((l) => l.id === scope);

  const { changed, discrepancies } = useMemo(() => {
    if (!rows) return { changed: 0, discrepancies: 0 };
    let changedCount = 0;
    let discrepancyCount = 0;
    for (const row of rows) {
      const c = counts[row.id];
      if (!c) continue;
      const g = Number(c.good);
      const f = Number(c.fair);
      const b = Number(c.bad);
      if (g !== row.good || f !== row.fair || b !== row.bad) {
        changedCount += 1;
        if (b > row.bad) discrepancyCount += 1;
      }
    }
    return { changed: changedCount, discrepancies: discrepancyCount };
  }, [rows, counts]);

  function setCount(rowId: string, field: "good" | "fair" | "bad", value: string) {
    setCounts((prev) => {
      const existing = prev[rowId] ?? { good: "", fair: "", bad: "" };
      return { ...prev, [rowId]: { ...existing, [field]: value } };
    });
  }

  if (!started) {
    return (
      <PageContainer>
        <button
          onClick={() => router.push("/verification")}
          className="mb-3.5 text-[13px] font-semibold text-muted-foreground"
        >
          ← Cancel verification
        </button>
        <h1 className="mb-1.5 font-heading text-2xl font-semibold tracking-tight">Start verification</h1>
        <p className="mb-5 text-sm text-muted-foreground">Choose which locations to count.</p>

        <div className="rounded-lg border border-border bg-card p-6">
          <RadioGroup value={scope} onValueChange={setScope}>
            {locations?.map((loc) => (
              <div key={loc.id} className="flex items-center gap-2.5 py-1.5">
                <RadioGroupItem value={loc.id} id={loc.id} />
                <Label htmlFor={loc.id} className="text-sm font-normal">
                  {loc.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Button className="mt-4 w-full" disabled={!scope} onClick={() => setStarted(true)}>
          Continue
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <button
        onClick={() => router.push("/verification")}
        className="mb-3.5 text-[13px] font-semibold text-muted-foreground"
      >
        ← Cancel verification
      </button>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-heading text-xl font-semibold tracking-tight">
            Count sheet — {location?.name}
          </h1>
          <p className="text-[13.5px] text-muted-foreground">
            Enter the counts you see now. Last known values are shown in grey.
          </p>
        </div>
        <div className="rounded-xl border border-[#CFE0F7] bg-accent px-3.5 py-2 text-right">
          <div className="font-mono text-sm font-semibold text-primary">
            {changed} changed · {discrepancies} discrepancy
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isPending ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[1.6fr_repeat(3,1fr)] gap-2.5 border-b border-border px-[18px] py-2.5 text-[11px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                <div>Asset</div>
                <div>Good</div>
                <div>Fair</div>
                <div>Bad</div>
              </div>
              {rows?.map((row) => {
                const c = counts[row.id];
                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1.6fr_repeat(3,1fr)] items-center gap-2.5 border-b border-border px-[18px] py-2.5 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <div className="mb-0.5 text-[13.5px] font-medium">{row.description}</div>
                      <AssetCodeChip code={row.code} className="text-[9px]" />
                    </div>
                    {(["good", "fair", "bad"] as const).map((field) => (
                      <div key={field} className="flex items-center gap-2">
                        <span className="w-[18px] font-mono text-xs text-muted-foreground">{row[field]}</span>
                        <Input
                          value={c?.[field] ?? ""}
                          onChange={(e) => setCount(row.id, field, e.target.value)}
                          placeholder={String(row[field])}
                          className="h-8 w-[54px] px-2 text-center font-mono text-[13px]"
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2.5">
        <Button variant="outline" onClick={() => router.push("/verification")}>
          Save &amp; finish later
        </Button>
        <Button
          onClick={() => {
            toast("Verification complete");
            router.push("/verification");
          }}
        >
          Review &amp; complete
        </Button>
      </div>
    </PageContainer>
  );
}
