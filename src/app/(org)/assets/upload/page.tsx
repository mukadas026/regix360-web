"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { AssetCodeChip } from "@/components/global/asset-code-chip";
import { ConditionBar } from "@/components/global/condition-bar";
import { DataTable } from "@/components/global/data-table";
import { PageContainer } from "@/components/global/page-container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PreviewRow = { desc: string; code: string; locName: string; good: number; fair: number; bad: number; qty: number };

const steps = [
  { n: 1, label: "Template" },
  { n: 2, label: "Map columns" },
  { n: 3, label: "Preview & reconcile" },
  { n: 4, label: "Done" },
];

const detectedColumns = [
  { their: "Item Name", ours: "Asset Name" },
  { their: "Branch", ours: "Location" },
  { their: "Good Qty", ours: "Qty Good" },
  { their: "Fair Qty", ours: "Qty Fair" },
  { their: "Damaged Qty", ours: "Qty Bad" },
  { their: "Notes", ours: "— Ignore —" },
];

const newLocations = ["Prampram", "Adjen-Kotoku", "Community 22"];

const unknownItems = [
  { row: 118, desc: "Wooden bench, dark stain" },
  { row: 240, desc: "Portable AC unit" },
  { row: 812, desc: "Choir robe rack" },
];

const errorRows = [
  { row: 56, problem: "No quantity given for any condition" },
  { row: 301, problem: "Location column is blank" },
  { row: 1190, problem: "Qty Good is not a number ('several')" },
];

const previewRows = [
  { desc: "Ceiling fan", code: "CFCC/AGB/CFAN/0043", locName: "Agbogba", good: 6, fair: 1, bad: 0, qty: 7 },
  { desc: "Plastic chair", code: "CFCC/ELG/PCHR/0512", locName: "East Legon", good: 40, fair: 5, bad: 2, qty: 47 },
  { desc: "Ceiling speaker", code: "CFCC/SPX/CSPK/0091", locName: "Spintex", good: 8, fair: 0, bad: 0, qty: 8 },
  { desc: "Foldable table", code: "CFCC/TEM/FTBL/0037", locName: "Tema", good: 12, fair: 2, bad: 1, qty: 15 },
];

const previewColumns: ColumnDef<PreviewRow>[] = [
  { accessorKey: "desc", header: "Asset" },
  { id: "code", header: "Code", cell: ({ row }) => <AssetCodeChip code={row.original.code} className="text-[9px]" /> },
  { accessorKey: "locName", header: "Location" },
  {
    id: "condition",
    header: "Condition",
    cell: ({ row }) => (
      <ConditionBar good={row.original.good} fair={row.original.fair} bad={row.original.bad} showLabel={false} className="w-28" />
    ),
  },
  {
    accessorKey: "qty",
    header: () => <div className="text-right">Qty</div>,
    cell: ({ row }) => <div className="text-right font-mono">{row.original.qty}</div>,
  },
];

export default function UploadAssetsPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const columns = useMemo(() => previewColumns, []);

  return (
    <PageContainer>
      <button
        onClick={() => router.push("/assets")}
        className="mb-3.5 text-[13px] font-semibold text-muted-foreground"
      >
        ← Back to register
      </button>
      <h1 className="mb-5 font-heading text-2xl font-semibold tracking-tight">Upload assets</h1>

      <div className="mb-6 flex items-center">
        {steps.map((s) => (
          <div key={s.n} className="flex flex-1 items-center">
            <div className="flex flex-none items-center gap-2.5">
              <span
                className={cn(
                  "flex size-6 flex-none items-center justify-center rounded-full font-mono text-xs font-semibold",
                  s.n < step
                    ? "bg-primary text-primary-foreground"
                    : s.n === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                )}
              >
                {s.n}
              </span>
              <span
                className={cn(
                  "text-[13px] font-semibold whitespace-nowrap",
                  s.n <= step ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {s.n < steps.length && (
              <span className={cn("mx-3 h-0.5 flex-1", s.n < step ? "bg-primary" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="rounded-lg border border-border bg-card p-[26px]">
          <h2 className="mb-1.5 font-heading text-lg font-semibold">Start with the template</h2>
          <p className="mb-[18px] max-w-[520px] text-sm text-muted-foreground">
            Fill this in, or upload a sheet you already have — we&apos;ll help you map the columns. Required: asset
            name, location, and at least one quantity.
          </p>
          <Button
            variant="outline"
            className="mb-[22px]"
            onClick={() => toast("Template download — not wired up yet")}
          >
            ⬇ Download template (.xlsx)
          </Button>
          <button
            onClick={() => setStep(2)}
            className="w-full rounded-lg border-2 border-dashed border-input px-5 py-10 text-center"
          >
            <div className="mb-2 text-[28px] text-muted-foreground">⬆</div>
            <div className="mb-0.5 text-[15px] font-semibold">Drop your spreadsheet here</div>
            <div className="text-[13px] text-muted-foreground">or click to browse — .xlsx or .csv</div>
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-6 py-5">
            <h2 className="mb-1 font-heading text-lg font-semibold">Map your columns</h2>
            <p className="text-[13.5px] text-muted-foreground">
              We matched <span className="font-mono">cfcc-assets-2025.xlsx</span> to our fields. Check the matches
              below.
            </p>
          </div>
          <div className="px-6 pt-2 pb-[18px]">
            <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-x-4 border-b border-border py-2.5 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
              <div>Column in your file</div>
              <div />
              <div>Maps to</div>
            </div>
            {detectedColumns.map((c) => (
              <div
                key={c.their}
                className="grid grid-cols-[1fr_28px_1fr] items-center gap-x-4 border-b border-border py-2.5 last:border-b-0"
              >
                <div className="font-mono text-[13px]">{c.their}</div>
                <div className="text-center text-muted-foreground">→</div>
                <select
                  defaultValue={c.ours}
                  className={cn(
                    "h-9 w-full rounded-md border border-input bg-card px-2.5 text-[13.5px]",
                    c.ours === "— Ignore —" && "text-muted-foreground",
                  )}
                >
                  <option>{c.ours}</option>
                  <option>Asset Name</option>
                  <option>Location</option>
                  <option>Qty Good</option>
                  <option>Qty Fair</option>
                  <option>Qty Bad</option>
                  <option>Category</option>
                  <option>Make/Model</option>
                  <option>Supplier</option>
                  <option>— Ignore —</option>
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-border px-6 py-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)}>Preview import</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-[18px] rounded-lg bg-foreground px-5 py-4 text-white">
            <span className="font-mono text-[22px] font-medium">2,328</span>
            <div className="text-[13.5px] leading-snug">
              assets found across <span className="font-mono">12</span> locations.
              <br />
              <span className="text-[#B9D2F6]">45 rows need your attention</span> before import.
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card px-5 py-[18px]">
            <div className="mb-1 font-heading text-[14.5px] font-semibold">3 new locations</div>
            <p className="mb-3 text-[13px] text-muted-foreground">
              These aren&apos;t in your account yet. We&apos;ll create them — or merge a duplicate spelling into an
              existing one.
            </p>
            <div className="flex flex-wrap gap-2">
              {newLocations.map((loc) => (
                <span
                  key={loc}
                  className="inline-flex items-center gap-2 rounded-md border border-[#CFE0D6] bg-[#EDF2F9] px-2.5 py-1.5 text-[13px]"
                >
                  <span className="size-1.5 rounded-full bg-status-good" />
                  {loc} <span className="cursor-pointer text-xs text-muted-foreground">merge…</span>
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card px-5 py-[18px]">
            <div className="mb-1 font-heading text-[14.5px] font-semibold">
              Unknown items <span className="font-normal text-muted-foreground">— pick a category so we can generate a code</span>
            </div>
            <div className="mt-2.5">
              {unknownItems.map((u) => (
                <div
                  key={u.row}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0"
                >
                  <div className="min-w-0 text-[13.5px]">
                    <span className="font-mono text-xs text-muted-foreground">row {u.row}</span> &nbsp; {u.desc}
                  </div>
                  <select className="h-9 rounded-md border border-input bg-card px-2.5 text-[13px]">
                    <option>Pick category…</option>
                    <option>Seating</option>
                    <option>Audio</option>
                    <option>Furniture</option>
                    <option>Appliance</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#E8C9C2] bg-[#FBF1EF] px-5 py-[18px]">
            <div className="mb-2.5 font-heading text-[14.5px] font-semibold text-status-bad">
              3 rows can&apos;t be imported
            </div>
            {errorRows.map((er) => (
              <div key={er.row} className="flex items-center gap-2.5 py-1.5 text-[13.5px]">
                <span className="w-[64px] flex-none font-mono text-xs whitespace-nowrap text-status-bad">row {er.row}</span>
                <span>{er.problem}</span>
              </div>
            ))}
            <p className="mt-2.5 text-[12.5px] text-[#9C5247]">
              These will be skipped unless fixed. Nothing is committed yet.
            </p>
          </div>

          <div>
            <div className="mb-2 font-heading text-sm font-semibold">
              Preview <span className="text-[13px] font-normal text-muted-foreground">— first rows, codes generated</span>
            </div>
            <DataTable data={previewRows} columns={columns} pageSize={20} />
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => toast("45 rows skipped")}
                className="text-[13.5px] font-semibold text-muted-foreground"
              >
                Skip 45 rows
              </button>
              <Button onClick={() => setStep(4)}>Import 2,283 assets</Button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <div className="mx-auto mb-4 flex size-[54px] items-center justify-center rounded-full bg-[#EAF3EE] text-[26px] text-status-good">
            ✓
          </div>
          <h2 className="mb-2 font-heading text-xl font-semibold">Import complete</h2>
          <p className="mb-[22px] text-[14.5px] text-muted-foreground">
            <span className="font-mono text-foreground">2,283</span> assets added ·{" "}
            <span className="font-mono text-foreground">3</span> locations created ·{" "}
            <span className="font-mono text-foreground">45</span> rows skipped
          </p>
          <div className="flex justify-center gap-2.5">
            <Button variant="outline" onClick={() => toast("Downloading skipped rows — not wired up yet")}>
              Download skipped rows
            </Button>
            <Button onClick={() => router.push("/assets")}>View register →</Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
