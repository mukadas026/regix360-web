"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAsset } from "@/api";
import type { AssetStatus, Condition } from "@/types/asset-platform";
import { AssetCodeChip } from "@/components/global/asset-code-chip";
import { AssetImageGalleryDialog } from "@/components/global/asset-image-gallery-dialog";
import { BatchPhotoViewerDialog } from "@/components/global/batch-photo-viewer-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/providers/session-provider";

const conditionBadgeVariant: Record<Condition, "default" | "secondary" | "destructive"> = {
  good: "default",
  fair: "secondary",
  bad: "destructive",
};

const statusLabel: Record<AssetStatus, string> = {
  active: "Active",
  under_maintenance: "Under maintenance",
  disposed: "Disposed",
  missing: "Missing",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return `GHS ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Read-only unit detail + condition/transfer history. Actions (edit
 * details, adjust condition, change custodian, update status, transfer,
 * maintenance, disposal) live on the asset group page's per-unit menu —
 * this sheet is deliberately just a viewer, opened from "View history".
 */
export function AssetDetailSheet({
  assetId,
  onClose,
  fallbackImageUrl = null,
}: {
  assetId: string | null;
  onClose: () => void;
  // The unit's own thumbnail, already known from wherever this sheet was
  // opened (e.g. the units table row) — passed through to the gallery
  // dialog as a safety net (see AssetImageGalleryDialog).
  fallbackImageUrl?: string | null;
}) {
  const { canEdit } = useSession();
  const queryClient = useQueryClient();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [batchPhotoOpen, setBatchPhotoOpen] = useState(false);

  const { data: asset, isPending } = useQuery({
    queryKey: getAsset.key(assetId ?? ""),
    queryFn: () => getAsset.fn(assetId as string),
    enabled: Boolean(assetId),
    staleTime: 0,
  });

  return (
    <>
    <Sheet open={Boolean(assetId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[460px] max-w-[92vw] gap-0 p-0 sm:max-w-[92vw]">
        {isPending || !asset ? (
          <div className="p-6">
            <Skeleton className="mb-2 h-5 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        ) : (
          <>
            <SheetHeader className="flex-none gap-2 border-b border-border px-[22px] py-5">
              <SheetTitle className="font-heading text-lg font-semibold tracking-tight">
                {asset.description}
              </SheetTitle>
              <div className="flex flex-wrap items-center gap-2">
                <AssetCodeChip code={asset.code} className="text-[11px]" />
                <Badge variant={conditionBadgeVariant[asset.condition]} className="capitalize">
                  {asset.condition}
                </Badge>
                <Badge variant="outline">{statusLabel[asset.status]}</Badge>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-[22px]">
              <div className="mb-6 grid grid-cols-2 gap-x-5 gap-y-3.5">
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                    Location
                  </div>
                  <div className="text-sm">{asset.location_name}</div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                    Department
                  </div>
                  <div className="text-sm">{asset.department_name}</div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                    Category
                  </div>
                  <div className="text-sm">{asset.category}</div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                    Custodian
                  </div>
                  <div className="text-sm">{asset.custodian_name ?? "Unassigned"}</div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                    Manufacturer / model
                  </div>
                  <div className="text-sm">
                    {asset.manufacturer ?? "—"} {asset.model ? `/ ${asset.model}` : ""}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                    Serial number
                  </div>
                  <div className="text-sm">{asset.serial_number ?? "—"}</div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                    Supplier
                  </div>
                  <div className="text-sm text-muted-foreground">{asset.supplier ?? "—"}</div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                    Acquisition
                  </div>
                  <div className="text-sm capitalize">
                    {asset.acquisition_method} · {formatDate(asset.acquisition_date)}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                    Acquisition cost
                  </div>
                  <div className="text-sm">{formatMoney(asset.acquisition_cost)}</div>
                </div>
              </div>

              {(asset.batchImageUrl || asset.images.length > 0) && (
                <div className="mb-6">
                  <div className="mb-3 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                    Photos
                  </div>
                  {asset.batchImageUrl && (
                    <div className="mb-3">
                      <div className="mb-1 text-[11.5px] text-muted-foreground">Batch photo (shared)</div>
                      <button onClick={() => setBatchPhotoOpen(true)} title="View batch photo">
                        <img
                          src={asset.batchImageUrl}
                          alt=""
                          className="size-20 rounded-lg border border-border object-cover"
                        />
                      </button>
                    </div>
                  )}
                  {asset.images.length > 0 && (
                    <div>
                      <div className="mb-1 text-[11.5px] text-muted-foreground">This unit&apos;s photos</div>
                      <div className="grid grid-cols-4 gap-2">
                        {[...asset.images]
                          .sort((a, b) => a.position - b.position)
                          .map((img) => (
                            <button key={img.id} onClick={() => setGalleryOpen(true)} title="View this unit's photos">
                              <img
                                src={img.url}
                                alt=""
                                className="aspect-square w-full rounded-md border border-border object-cover"
                              />
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {asset.notes && (
                <div className="mb-6 rounded-xl border border-border px-4 py-3.5">
                  <div className="mb-1.5 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                    Notes
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{asset.notes}</p>
                </div>
              )}

              <div className="mb-3 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                Condition history
              </div>
              {asset.history.length === 0 ? (
                <p className="mb-6 text-[12.5px] text-muted-foreground">No verification snapshots yet.</p>
              ) : (
                <div className="relative mb-6 pl-4">
                  <div className="absolute top-1 bottom-2 left-[3px] w-0.5 bg-border" />
                  {asset.history.map((h, i) => (
                    <div key={i} className="relative mb-4 last:mb-0">
                      <span className="absolute top-[3px] -left-4 size-2 rounded-full border-2 border-card bg-[#123C7A]" />
                      <div className="font-mono text-[12.5px] font-semibold">{formatDate(h.counted_at)}</div>
                      <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                        {h.prev_condition} → {h.counted_condition}
                        {!h.found && " · reported missing"} · counted by {h.counted_by_name}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-3 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                Transfers
              </div>
              {asset.transfers.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">No transfer history.</p>
              ) : (
                <div className="space-y-2.5">
                  {asset.transfers.map((t) => (
                    <div key={t.id} className="rounded-lg border border-border px-3.5 py-2.5">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-mono text-[12px] font-semibold">{t.code}</span>
                        <Badge variant="outline" className="capitalize">
                          {t.status}
                        </Badge>
                      </div>
                      <div className="text-[12.5px] text-muted-foreground">
                        {t.from_location_name} / {t.from_department_name}
                        {t.from_custodian_name ? ` (${t.from_custodian_name})` : ""} → {t.to_location_name} /{" "}
                        {t.to_department_name}
                        {t.to_custodian_name ? ` (${t.to_custodian_name})` : ""}
                      </div>
                      <div className="mt-1 text-[11.5px] text-muted-foreground">
                        Requested by {t.requested_by_name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-none gap-2 border-t border-border p-3.5">
              {canEdit && (
                <Button variant="outline" className="flex-1" onClick={() => setGalleryOpen(true)}>
                  Manage this unit&apos;s photos
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={() => window.open(`/labels/${asset.id}`, "_blank")}>
                Print label
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
    <AssetImageGalleryDialog
      assetId={assetId}
      open={galleryOpen}
      onOpenChange={setGalleryOpen}
      fallbackImageUrl={fallbackImageUrl}
    />
    <BatchPhotoViewerDialog
      batchId={asset?.batch_id ?? null}
      imageUrl={asset?.batchImageUrl ?? null}
      open={batchPhotoOpen}
      onOpenChange={setBatchPhotoOpen}
      onChanged={() => {
        queryClient.invalidateQueries({ queryKey: getAsset.key(assetId ?? "") });
        queryClient.invalidateQueries({ queryKey: ["assets"] });
      }}
      canManage={canEdit}
    />
    </>
  );
}
