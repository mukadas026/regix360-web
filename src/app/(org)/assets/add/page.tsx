"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addAsset, getCategoryDictionary, getLocations } from "@/api";
import { PageContainer } from "@/components/global/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddAssetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: locations } = useQuery({ queryKey: getLocations.key, queryFn: getLocations.fn });
  const { data: dictionary } = useQuery({ queryKey: getCategoryDictionary.key, queryFn: getCategoryDictionary.fn });

  const [description, setDescription] = useState("");
  const [locationId, setLocationId] = useState("");
  const [good, setGood] = useState("");
  const [fair, setFair] = useState("");
  const [bad, setBad] = useState("");
  const [makeModel, setMakeModel] = useState("");
  const [supplier, setSupplier] = useState("");

  const suggestion = useMemo(() => {
    if (!description || !dictionary) return null;
    return dictionary.find((c) => description.toLowerCase().includes(c.itemCode.toLowerCase())) ?? null;
  }, [description, dictionary]);

  const { mutate, isPending } = useMutation({
    mutationFn: addAsset.fn,
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: getLocations.key });
      toast(`Asset added — ${asset.code}`);
      router.push("/assets");
    },
  });

  function handleSave() {
    mutate({
      description,
      locationId,
      good: Number(good) || 0,
      fair: Number(fair) || 0,
      bad: Number(bad) || 0,
      makeModel: makeModel || null,
      supplier: supplier || null,
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
        <Label className="mb-1.5 text-[12.5px] font-semibold">Description</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Ceiling fan"
          className="mb-2"
        />
        {suggestion && (
          <div className="mb-3.5 flex items-center gap-2 rounded-md border border-[#CFE0F7] bg-accent px-3 py-2 text-[13px] text-accent-foreground">
            <span className="font-semibold">Matched in dictionary:</span>
            <span>{suggestion.category}</span>
            <span className="rounded border border-[#CFE0F7] bg-card px-1.5 py-0.5 font-mono">{suggestion.itemCode}</span>
          </div>
        )}
        <Label className="mt-1.5 mb-1.5 text-[12.5px] font-semibold">Location</Label>
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
      </div>

      <div className="mb-[18px] rounded-lg border border-border bg-card px-6 py-[22px]">
        <div className="mb-3.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Details <span className="font-normal text-muted-foreground normal-case">— optional</span>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Make / model</Label>
            <Input value={makeModel} onChange={(e) => setMakeModel(e.target.value)} placeholder="e.g. Binatone CF-1610" />
          </div>
          <div>
            <Label className="mb-1.5 text-[12.5px] font-semibold">Supplier</Label>
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex gap-2.5">
        <Button onClick={handleSave} disabled={!description || !locationId || isPending}>
          Add asset
        </Button>
        <Button variant="outline" onClick={() => router.push("/assets")}>
          Cancel
        </Button>
      </div>
      <p className="mt-3.5 text-[12.5px] text-muted-foreground">
        The asset code is generated from branch + matched item code + next serial when you save.
      </p>
    </PageContainer>
  );
}
