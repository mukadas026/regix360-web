"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { getAsset, updateAsset } from "@/api";
import type { ApiError } from "@/api";
import type { AssetDetail } from "@/types/asset-platform";
import { AppDialog } from "@/components/global/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const acquisitionMethods: { value: AssetDetail["acquisition_method"]; label: string }[] = [
  { value: "purchase", label: "Purchase" },
  { value: "donation", label: "Donation" },
  { value: "transfer", label: "Transfer" },
  { value: "other", label: "Other" },
];

type DetailsForm = {
  description: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  supplier: string;
  acquisitionMethod: AssetDetail["acquisition_method"];
  acquisitionDate: string;
  acquisitionCost: string;
  customCode: string;
  notes: string;
};

function toDetailsForm(asset: AssetDetail): DetailsForm {
  return {
    description: asset.description,
    manufacturer: asset.manufacturer ?? "",
    model: asset.model ?? "",
    serialNumber: asset.serial_number ?? "",
    supplier: asset.supplier ?? "",
    acquisitionMethod: asset.acquisition_method,
    acquisitionDate: asset.acquisition_date ?? "",
    acquisitionCost: asset.acquisition_cost != null ? String(asset.acquisition_cost) : "",
    customCode: asset.custom_code ?? "",
    notes: asset.notes ?? "",
  };
}

/**
 * Edits the descriptive/audit fields only — description, manufacturer,
 * model, serial number, supplier, acquisition details, custom code, notes.
 * Condition, status, and custodian are deliberately NOT here — those are
 * their own dedicated confirm actions (see the asset register's per-unit
 * menu), each consequential enough to warrant its own confirm step.
 */
function DetailsFormFields({
  asset,
  unitId,
  onSaved,
  onCancel,
}: {
  asset: AssetDetail;
  unitId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  // Initialized once per asset (the parent remounts this via `key`) — not
  // synced through an effect, so edits aren't clobbered by a background refetch.
  const [form, setForm] = useState<DetailsForm>(() => toDetailsForm(asset));

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: (input: DetailsForm) =>
      updateAsset.fn(unitId, {
        description: input.description,
        manufacturer: input.manufacturer || null,
        model: input.model || null,
        serialNumber: input.serialNumber || null,
        supplier: input.supplier || null,
        acquisitionMethod: input.acquisitionMethod,
        acquisitionDate: input.acquisitionDate || null,
        acquisitionCost: input.acquisitionCost ? Number(input.acquisitionCost) : null,
        customCode: input.customCode || null,
        notes: input.notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getAsset.key(unitId) });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset-units"] });
      toast("Asset details updated");
      onSaved();
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not update asset."),
  });

  return (
    <>
      <div className="space-y-3.5">
        <div>
          <Label className="mb-1.5 text-[12.5px] font-semibold">Description</Label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Manufacturer</Label>
            <Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Model</Label>
            <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Serial number</Label>
            <Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Supplier</Label>
            <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Acquisition method</Label>
            <select
              value={form.acquisitionMethod}
              onChange={(e) =>
                setForm({ ...form, acquisitionMethod: e.target.value as AssetDetail["acquisition_method"] })
              }
              className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
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
            <Input
              type="date"
              value={form.acquisitionDate}
              onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label className="mb-1.5 text-[12.5px] font-semibold">Acquisition cost (per unit)</Label>
          <Input
            type="number"
            value={form.acquisitionCost}
            onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })}
          />
        </div>
        <div>
          <Label className="mb-1.5 text-[12.5px] font-semibold">
            Custom code <span className="font-normal text-muted-foreground">— legacy batch, optional</span>
          </Label>
          <Input value={form.customCode} onChange={(e) => setForm({ ...form, customCode: e.target.value })} />
        </div>
        <div>
          <Label className="mb-1.5 text-[12.5px] font-semibold">Notes</Label>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button disabled={!form.description || isSaving} onClick={() => mutate(form)}>
          Save changes
        </Button>
      </div>
    </>
  );
}

export function AssetEditDetailsDialog({
  unitId,
  open,
  onOpenChange,
}: {
  unitId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: asset, isPending } = useQuery({
    queryKey: getAsset.key(unitId ?? ""),
    queryFn: () => getAsset.fn(unitId as string),
    enabled: open && Boolean(unitId),
  });

  return (
    <AppDialog open={open} onOpenChange={onOpenChange} kind="modal" title="Edit asset details">
      {isPending || !asset ? (
        <p className="text-[13px] text-muted-foreground">Loading…</p>
      ) : (
        <DetailsFormFields
          key={asset.id}
          asset={asset}
          unitId={unitId as string}
          onSaved={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      )}
    </AppDialog>
  );
}
