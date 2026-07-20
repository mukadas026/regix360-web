"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  commitImport,
  downloadSkippedCsv,
  getCategories,
  getDepartments,
  getImportStatus,
  initImport,
  markUploaded,
  previewImport,
  uploadImportFile,
} from "@/api";
import type {
  CategoryOption,
  ImportInitResult,
  ImportPreviewResult,
  ImportUploadedResult,
} from "@/types/asset-platform";
import { PageContainer } from "@/components/global/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type WizardStep = "upload" | "mapping" | "preview" | "done";

type MappingField = { value: string; label: string };

const MAPPING_FIELDS: MappingField[] = [
  { value: "description", label: "Description" },
  { value: "location", label: "Location" },
  { value: "department", label: "Department" },
  { value: "qty_good", label: "Qty good" },
  { value: "qty_fair", label: "Qty fair" },
  { value: "qty_bad", label: "Qty bad" },
  { value: "qty_total", label: "Qty total" },
  { value: "manufacturer", label: "Manufacturer" },
  { value: "model", label: "Model" },
  { value: "serial_number", label: "Serial number" },
  { value: "supplier", label: "Supplier" },
  { value: "acquisition_method", label: "Acquisition method" },
  { value: "acquisition_date", label: "Acquisition date" },
  { value: "acquisition_cost", label: "Acquisition cost" },
  { value: "custom_code", label: "Custom code" },
  { value: "notes", label: "Notes" },
  { value: "ignore", label: "— Ignore —" },
];

const REQUIRED_FIELDS = ["description", "location", "department"];

const steps = [
  { n: 1, label: "Upload" },
  { n: 2, label: "Map columns" },
  { n: 3, label: "Preview & reconcile" },
  { n: 4, label: "Done" },
];

function stepNumber(step: WizardStep) {
  if (step === "upload") return 1;
  if (step === "mapping") return 2;
  if (step === "preview") return 3;
  return 4;
}

export default function UploadAssetsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<WizardStep>("upload");
  const [uploadStage, setUploadStage] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedResult, setUploadedResult] = useState<ImportUploadedResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});
  const [locationCodes, setLocationCodes] = useState<Record<string, string>>({});
  const [departmentCodes, setDepartmentCodes] = useState<Record<string, string>>({});

  const { data: existingDepartments } = useQuery({
    queryKey: getDepartments.key,
    queryFn: () => getDepartments.fn(),
    enabled: step === "preview",
  });

  const usedDepartmentCodes = useMemo(
    () => new Set((existingDepartments ?? []).map((d) => d.code?.toUpperCase()).filter(Boolean)),
    [existingDepartments],
  );

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadStage("Creating import batch…");
      const init: ImportInitResult = (await initImport.fn(file.name))!;
      setBatchId(init.batchId);
      setFileName(init.fileName);

      setUploadStage("Uploading file…");
      await uploadImportFile(init.upload, file);

      setUploadStage("Reading file…");
      const uploaded = (await markUploaded.fn(init.batchId))!;
      return uploaded;
    },
    onSuccess: (uploaded) => {
      setUploadedResult(uploaded);
      setColumnMapping(uploaded.suggestedMapping);
      setStep("mapping");
      setUploadStage(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message ?? "Upload failed. Try again.");
      setUploadStage(null);
    },
  });

  const previewMutation = useMutation({
    mutationFn: () => previewImport.fn({ batchId: batchId!, columnMapping }),
    onSuccess: (result) => {
      setPreviewResult(result ?? null);
      setCategoryOverrides({});
      setLocationCodes({});
      setDepartmentCodes({});
      setStep("preview");
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message ?? "Couldn't preview this file.");
    },
  });

  const commitMutation = useMutation({
    mutationFn: () =>
      commitImport.fn({
        batchId: batchId!,
        categoryOverrides: Object.keys(categoryOverrides).length ? categoryOverrides : undefined,
        locationCodes: Object.keys(locationCodes).length ? locationCodes : undefined,
        departmentCodes: Object.keys(departmentCodes).length ? departmentCodes : undefined,
      }),
    onSuccess: () => {
      setStep("done");
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message ?? "Couldn't start the import.");
    },
  });

  const statusQuery = useQuery({
    queryKey: getImportStatus.key(batchId ?? ""),
    queryFn: () => getImportStatus.fn(batchId!),
    enabled: step === "done" && !!batchId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 2000;
    },
  });

  const importRecord = statusQuery.data;

  const handleFileChosen = useCallback(
    (file: File | null) => {
      if (!file) return;
      uploadMutation.mutate(file);
    },
    [uploadMutation],
  );

  const handleMappingChange = (header: string, value: string) => {
    setColumnMapping((prev) => ({ ...prev, [header]: value }));
  };

  const mappedFields = useMemo(() => new Set(Object.values(columnMapping)), [columnMapping]);
  const canPreview = REQUIRED_FIELDS.every((field) => mappedFields.has(field));

  const goBackToRegister = () => router.push("/assets");

  const resetWizard = () => {
    setStep("upload");
    setUploadStage(null);
    setBatchId(null);
    setFileName(null);
    setUploadedResult(null);
    setColumnMapping({});
    setPreviewResult(null);
    setCategoryOverrides({});
    setLocationCodes({});
    setDepartmentCodes({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <PageContainer>
      <button onClick={goBackToRegister} className="mb-3.5 text-[13px] font-semibold text-muted-foreground">
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
                  s.n <= stepNumber(step) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                )}
              >
                {s.n}
              </span>
              <span
                className={cn(
                  "text-[13px] font-semibold whitespace-nowrap",
                  s.n <= stepNumber(step) ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {s.n < steps.length && (
              <span className={cn("mx-3 h-0.5 flex-1", s.n < stepNumber(step) ? "bg-primary" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      {step === "upload" && (
        <div className="rounded-lg border border-border bg-card p-[26px]">
          <h2 className="mb-1.5 font-heading text-lg font-semibold">Upload your spreadsheet</h2>
          <p className="mb-[18px] max-w-[520px] text-sm text-muted-foreground">
            Upload an Excel (.xlsx) or CSV file — we&apos;ll help you map the columns next. Required: description,
            location, and department.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(e) => handleFileChosen(e.target.files?.[0] ?? null)}
          />
          {uploadMutation.isPending ? (
            <div className="w-full rounded-lg border-2 border-dashed border-input px-5 py-10 text-center">
              <div className="mb-2 text-[28px] text-muted-foreground">⏳</div>
              <div className="mb-0.5 text-[15px] font-semibold">{uploadStage ?? "Working…"}</div>
              <div className="text-[13px] text-muted-foreground">This won&apos;t take long.</div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-input px-5 py-10 text-center"
            >
              <div className="mb-2 text-[28px] text-muted-foreground">⬆</div>
              <div className="mb-0.5 text-[15px] font-semibold">Drop your spreadsheet here</div>
              <div className="text-[13px] text-muted-foreground">or click to browse — .xlsx or .csv</div>
            </button>
          )}
        </div>
      )}

      {step === "mapping" && uploadedResult && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-6 py-5">
            <h2 className="mb-1 font-heading text-lg font-semibold">Map your columns</h2>
            <p className="text-[13.5px] text-muted-foreground">
              <span className="font-mono">{fileName}</span> — {uploadedResult.totalRows} rows detected. Check the
              matches below; description, location, and department are required.
            </p>
            {uploadedResult.similarPreviousImport && (
              <p className="mt-2 rounded-md bg-secondary px-3 py-2 text-[12.5px] text-muted-foreground">
                Heads up — this looks similar to{" "}
                <span className="font-mono">{uploadedResult.similarPreviousImport.file_name}</span> imported on{" "}
                {new Date(uploadedResult.similarPreviousImport.created_at).toLocaleDateString()}. Make sure this
                isn&apos;t a duplicate.
              </p>
            )}
          </div>
          <div className="px-6 pt-2 pb-[18px]">
            <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-x-4 border-b border-border py-2.5 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
              <div>Column in your file</div>
              <div />
              <div>Maps to</div>
            </div>
            {uploadedResult.headers.map((header) => {
              const value = columnMapping[header] ?? "ignore";
              const isRequired = REQUIRED_FIELDS.includes(value);
              return (
                <div
                  key={header}
                  className="grid grid-cols-[1fr_28px_1fr] items-center gap-x-4 border-b border-border py-2.5 last:border-b-0"
                >
                  <div className="font-mono text-[13px]">{header}</div>
                  <div className="text-center text-muted-foreground">→</div>
                  <select
                    value={value}
                    onChange={(e) => handleMappingChange(header, e.target.value)}
                    className={cn(
                      "h-9 w-full rounded-md border border-input bg-card px-2.5 text-[13.5px]",
                      value === "ignore" && "text-muted-foreground",
                      isRequired && "border-primary",
                    )}
                  >
                    {MAPPING_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          {!canPreview && (
            <div className="border-t border-border bg-secondary/60 px-6 py-3 text-[13px] text-muted-foreground">
              Map a description, a location, and a department column to continue.
            </div>
          )}
          <div className="flex justify-between border-t border-border px-6 py-4">
            <Button variant="outline" onClick={resetWizard}>
              Back
            </Button>
            <Button disabled={!canPreview || previewMutation.isPending} onClick={() => previewMutation.mutate()}>
              {previewMutation.isPending ? "Checking…" : "Preview import"}
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && previewResult && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-[18px] rounded-lg bg-foreground px-5 py-4 text-white">
            <span className="font-mono text-[22px] font-medium">{previewResult.validRows}</span>
            <div className="text-[13.5px] leading-snug">
              rows found, expanding to <span className="font-mono">{previewResult.unitTotal}</span> individual units.
              {previewResult.skipped.length > 0 && (
                <>
                  <br />
                  <span className="text-[#B9D2F6]">{previewResult.skipped.length} rows need your attention</span>{" "}
                  before import.
                </>
              )}
            </div>
          </div>

          {previewResult.newLocations.length > 0 && (
            <div className="rounded-lg border border-border bg-card px-5 py-[18px]">
              <div className="mb-1 font-heading text-[14.5px] font-semibold">
                {previewResult.newLocations.length} new location{previewResult.newLocations.length === 1 ? "" : "s"}
              </div>
              <p className="mb-3 text-[13px] text-muted-foreground">
                These aren&apos;t in your account yet. We&apos;ll create them with the codes below — adjust if you
                like.
              </p>
              <div className="flex flex-col gap-2">
                {previewResult.newLocations.map((loc) => (
                  <div key={loc.name} className="flex items-center justify-between gap-3">
                    <span className="text-[13.5px]">{loc.name}</span>
                    <Input
                      className="h-8 w-28 font-mono uppercase"
                      defaultValue={loc.suggestedCode}
                      onChange={(e) =>
                        setLocationCodes((prev) => ({ ...prev, [loc.name]: e.target.value.toUpperCase() }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewResult.newDepartments.length > 0 && (
            <div className="rounded-lg border border-border bg-card px-5 py-[18px]">
              <div className="mb-1 font-heading text-[14.5px] font-semibold">
                {previewResult.newDepartments.length} new department
                {previewResult.newDepartments.length === 1 ? "" : "s"}
              </div>
              <p className="mb-3 text-[13px] text-muted-foreground">
                These aren&apos;t in your account yet. We&apos;ll create them with the codes below — adjust if you
                like.
              </p>
              <div className="flex flex-col gap-2">
                {previewResult.newDepartments.map((dep) => {
                  const key = `${dep.location}::${dep.name}`;
                  const currentCode = departmentCodes[key] ?? dep.suggestedCode;
                  const collides = usedDepartmentCodes.has(currentCode.toUpperCase());
                  return (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className="text-[13.5px]">
                        {dep.name} <span className="text-muted-foreground">— {dep.location}</span>
                      </span>
                      <div className="flex flex-col items-end gap-1">
                        <Input
                          className={cn("h-8 w-28 font-mono uppercase", collides && "border-status-bad")}
                          defaultValue={dep.suggestedCode}
                          onChange={(e) =>
                            setDepartmentCodes((prev) => ({ ...prev, [key]: e.target.value.toUpperCase() }))
                          }
                        />
                        {collides && <span className="text-[11px] text-status-bad">code already in use</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {previewResult.unmatchedDescriptions.length > 0 && (
            <div className="rounded-lg border border-border bg-card px-5 py-[18px]">
              <div className="mb-1 font-heading text-[14.5px] font-semibold">
                Unmatched items{" "}
                <span className="font-normal text-muted-foreground">— pick a category so we can generate a code</span>
              </div>
              <div className="mt-2.5">
                {previewResult.unmatchedDescriptions.map((desc) => (
                  <div
                    key={desc}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0"
                  >
                    <div className="min-w-0 text-[13.5px]">{desc}</div>
                    <CategoryPicker
                      value={categoryOverrides[desc]}
                      onChange={(itemId) => setCategoryOverrides((prev) => ({ ...prev, [desc]: itemId }))}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-[12.5px] text-muted-foreground">
                Rows left unmatched at import time are skipped with reason &quot;No category match&quot;.
              </p>
            </div>
          )}

          {previewResult.skipped.length > 0 && (
            <div className="rounded-lg border border-[#E8C9C2] bg-[#FBF1EF] px-5 py-[18px]">
              <div className="mb-2.5 font-heading text-[14.5px] font-semibold text-status-bad">
                {previewResult.skipped.length} row{previewResult.skipped.length === 1 ? "" : "s"} can&apos;t be
                imported
              </div>
              {previewResult.skipped.slice(0, 20).map((row) => (
                <div key={row.rowNumber} className="flex items-center gap-2.5 py-1.5 text-[13.5px]">
                  <span className="w-[64px] flex-none font-mono text-xs whitespace-nowrap text-status-bad">
                    row {row.rowNumber}
                  </span>
                  <span>{row.reason}</span>
                </div>
              ))}
              {previewResult.skipped.length > 20 && (
                <p className="mt-1.5 text-[12.5px] text-[#9C5247]">
                  …and {previewResult.skipped.length - 20} more. The full list is downloadable after import.
                </p>
              )}
              <p className="mt-2.5 text-[12.5px] text-[#9C5247]">
                These will be skipped unless fixed. Nothing is committed yet.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep("mapping")}>
              Back
            </Button>
            <Button disabled={commitMutation.isPending} onClick={() => commitMutation.mutate()}>
              {commitMutation.isPending ? "Starting…" : `Import ${previewResult.unitTotal} units`}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          {!importRecord || (importRecord.status !== "completed" && importRecord.status !== "failed") ? (
            <>
              <div className="mx-auto mb-4 flex size-[54px] items-center justify-center rounded-full bg-secondary text-[26px]">
                ⏳
              </div>
              <h2 className="mb-2 font-heading text-xl font-semibold">Importing…</h2>
              <p className="text-[14.5px] text-muted-foreground">
                This can take a few minutes for large files. You can leave this page — the import keeps running.
              </p>
            </>
          ) : importRecord.status === "failed" ? (
            <>
              <div className="mx-auto mb-4 flex size-[54px] items-center justify-center rounded-full bg-[#FBF1EF] text-[26px] text-status-bad">
                ✕
              </div>
              <h2 className="mb-2 font-heading text-xl font-semibold">Import failed</h2>
              <p className="mb-[22px] text-[14.5px] text-muted-foreground">
                Nothing was committed. Try again, or check your column mapping and file for issues.
              </p>
              <div className="flex justify-center gap-2.5">
                <Button variant="outline" onClick={resetWizard}>
                  Start over
                </Button>
                <Button onClick={goBackToRegister}>Back to register</Button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex size-[54px] items-center justify-center rounded-full bg-[#EAF3EE] text-[26px] text-status-good">
                ✓
              </div>
              <h2 className="mb-2 font-heading text-xl font-semibold">Import complete</h2>
              <p className="mb-[22px] text-[14.5px] text-muted-foreground">
                <span className="font-mono text-foreground">{importRecord.imported_count ?? 0}</span> units added ·{" "}
                <span className="font-mono text-foreground">{importRecord.locations_created ?? 0}</span> locations
                created · <span className="font-mono text-foreground">{importRecord.departments_created ?? 0}</span>{" "}
                departments created ·{" "}
                <span className="font-mono text-foreground">{importRecord.skipped_count ?? 0}</span> rows skipped
              </p>
              <div className="flex justify-center gap-2.5">
                {(importRecord.skipped_count ?? 0) > 0 && (
                  <Button variant="outline" onClick={() => downloadSkippedCsv.fn(importRecord.id)}>
                    Download skipped rows
                  </Button>
                )}
                <Button
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["assets"] });
                    router.push("/assets");
                  }}
                >
                  View register →
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </PageContainer>
  );
}

function CategoryPicker({ value, onChange }: { value?: string; onChange: (itemId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: options } = useQuery({
    queryKey: getCategories.key(search),
    queryFn: () => getCategories.fn(search),
    enabled: open,
  });

  const selectedLabel = useMemo(() => {
    if (!value) return null;
    return (options ?? []).find((o) => o.id === value)?.item_description ?? null;
  }, [options, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 min-w-[180px] justify-between font-normal">
          {selectedLabel ?? value ?? "Pick category…"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search categories…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup>
              {(options ?? []).map((option: CategoryOption) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-[13px]">{option.item_description}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {option.category} · {option.item_code}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
