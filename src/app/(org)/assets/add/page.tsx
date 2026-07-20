"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { addAsset, getCategories, getDepartments, getLocations } from "@/api";
import type { AddAssetInput } from "@/api/assets";
import type { CategoryOption } from "@/types/asset-platform";
import { PageContainer } from "@/components/global/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const acquisitionMethods: { value: AddAssetInput["acquisitionMethod"]; label: string }[] = [
  { value: "purchase", label: "Purchase" },
  { value: "donation", label: "Donation" },
  { value: "transfer", label: "Transfer" },
  { value: "other", label: "Other" },
];

export default function AddAssetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: locations } = useQuery({ queryKey: getLocations.key, queryFn: getLocations.fn });

  const [description, setDescription] = useState("");

  const [categorySearch, setCategorySearch] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(null);
  const { data: categoryResults } = useQuery({
    queryKey: getCategories.key(categorySearch),
    queryFn: () => getCategories.fn(categorySearch),
    enabled: categorySearch.length >= 2 && categoryOpen,
  });

  const [locationId, setLocationId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const { data: departments, isFetching: departmentsLoading } = useQuery({
    queryKey: getDepartments.key,
    queryFn: () => getDepartments.fn(),
  });

  const [good, setGood] = useState("");
  const [fair, setFair] = useState("");
  const [bad, setBad] = useState("");

  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [acquisitionMethod, setAcquisitionMethod] = useState<AddAssetInput["acquisitionMethod"]>("purchase");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [notes, setNotes] = useState("");

  const quantityTotal = (Number(good) || 0) + (Number(fair) || 0) + (Number(bad) || 0);
  const canSave = Boolean(description && selectedCategory && locationId && departmentId && quantityTotal > 0);

  const { mutate, isPending } = useMutation({
    mutationFn: addAsset.fn,
    onSuccess: (summary) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      const ranges = summary.codeRanges
        .map((r) => `${r.count} ${r.condition} (${r.firstCode}–${r.lastCode})`)
        .join(", ");
      toast(`${summary.created} unit${summary.created === 1 ? "" : "s"} registered — ${ranges}`);
      router.push("/assets");
    },
  });

  function handleSave() {
    if (!selectedCategory) return;
    mutate({
      description,
      categoryItemId: selectedCategory.id,
      locationId,
      departmentId,
      good: Number(good) || 0,
      fair: Number(fair) || 0,
      bad: Number(bad) || 0,
      manufacturer: manufacturer || null,
      model: model || null,
      serialNumber: serialNumber || null,
      supplier: supplier || null,
      acquisitionMethod,
      acquisitionDate: acquisitionDate || null,
      acquisitionCost: acquisitionCost ? Number(acquisitionCost) : null,
      customCode: customCode || null,
      notes: notes || null,
    });
  }

  return (
    <PageContainer>
      <button
        onClick={() => router.push("/assets")}
        className="mb-3.5 text-[13px] font-semibold text-muted-foreground"
      >
        ← Back to register
      </button>
      <h1 className="mb-[22px] font-heading text-2xl font-semibold tracking-tight">Add asset</h1>

      <div className="mb-4 rounded-lg border border-border bg-card px-6 py-[22px]">
        <div className="mb-3.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Identity
        </div>
        <Label className="mb-1.5 text-[12.5px] font-semibold">Name</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Ceiling fan"
          className="mb-3.5"
        />

        <Label className="mb-1.5 text-[12.5px] font-semibold">Category</Label>
        <div className="relative mb-3.5">
          <Input
            value={selectedCategory ? `${selectedCategory.item_description} — ${selectedCategory.category}` : categorySearch}
            onChange={(e) => {
              setSelectedCategory(null);
              setCategorySearch(e.target.value);
              setCategoryOpen(true);
            }}
            onFocus={() => setCategoryOpen(true)}
            onBlur={() => setTimeout(() => setCategoryOpen(false), 150)}
            placeholder="Search category dictionary…"
          />
          {categoryOpen && categorySearch.length >= 2 && categoryResults && categoryResults.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card shadow-md">
              {categoryResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSelectedCategory(c);
                    setCategoryOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-secondary"
                >
                  <span>
                    {c.item_description} <span className="text-muted-foreground">— {c.category}</span>
                  </span>
                  <span className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10.5px]">
                    {c.item_code}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedCategory && (
          <div className="mb-3.5 flex items-center gap-2 rounded-md border border-[#CFE0F7] bg-accent px-3 py-2 text-[13px] text-accent-foreground">
            <span className="font-semibold">Matched in dictionary:</span>
            <span>{selectedCategory.category}</span>
            <span className="rounded border border-[#CFE0F7] bg-card px-1.5 py-0.5 font-mono">{selectedCategory.item_code}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Location</Label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">Select a location</option>
              {locations?.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Department</Label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={departmentsLoading}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm disabled:opacity-50"
            >
              <option value="">Select a department</option>
              {departments?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-border bg-card px-6 py-[22px]">
        <div className="mb-3.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Quantity &amp; condition
        </div>
        <div className="grid grid-cols-3 gap-3.5">
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold text-status-good">Good</Label>
            <Input value={good} onChange={(e) => setGood(e.target.value)} placeholder="0" className="font-mono" />
          </div>
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold text-status-fair">Fair</Label>
            <Input value={fair} onChange={(e) => setFair(e.target.value)} placeholder="0" className="font-mono" />
          </div>
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold text-status-bad">Bad</Label>
            <Input value={bad} onChange={(e) => setBad(e.target.value)} placeholder="0" className="font-mono" />
          </div>
        </div>
        <p className="mt-2.5 text-[12px] text-muted-foreground">
          One row will be created per unit — {quantityTotal || 0} unit{quantityTotal === 1 ? "" : "s"} total.
        </p>
      </div>

      <div className="mb-4 rounded-lg border border-border bg-card px-6 py-[22px]">
        <div className="mb-3.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Acquisition
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Acquisition method</Label>
            <select
              value={acquisitionMethod}
              onChange={(e) => setAcquisitionMethod(e.target.value as AddAssetInput["acquisitionMethod"])}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              {acquisitionMethods.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Acquisition date</Label>
            <Input type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Acquisition cost (per unit)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={acquisitionCost}
              onChange={(e) => setAcquisitionCost(e.target.value)}
              placeholder="0.00"
              className="font-mono"
            />
          </div>
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Custom code (legacy batch, optional)</Label>
            <Input value={customCode} onChange={(e) => setCustomCode(e.target.value)} placeholder="e.g. LEGACY-BATCH-001" />
          </div>
        </div>
      </div>

      <div className="mb-[18px] rounded-lg border border-border bg-card px-6 py-[22px]">
        <div className="mb-3.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Details <span className="font-normal text-muted-foreground normal-case">— optional</span>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Manufacturer</Label>
            <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="e.g. Binatone" />
          </div>
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Model</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. CF-1610" />
          </div>
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Serial number</Label>
            <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Supplier</Label>
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 text-[12.5px] font-semibold">Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex gap-2.5">
        <Button onClick={handleSave} disabled={!canSave || isPending}>
          Add asset
        </Button>
        <Button variant="outline" onClick={() => router.push("/assets")}>
          Cancel
        </Button>
      </div>
      <p className="mt-3.5 text-[12.5px] text-muted-foreground">
        The asset code is generated from branch + department + matched item code + next serial when you save.
      </p>
    </PageContainer>
  );
}
