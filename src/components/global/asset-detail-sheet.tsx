"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAsset } from "@/api";
import { AssetCodeChip } from "@/components/global/asset-code-chip";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/providers/session-provider";

export function AssetDetailSheet({ assetId, onClose }: { assetId: string | null; onClose: () => void }) {
  const { canEdit } = useSession();
  const { data: asset, isPending } = useQuery({
    queryKey: getAsset.key(assetId ?? ""),
    queryFn: () => getAsset.fn(assetId as string),
    enabled: Boolean(assetId),
  });

  return (
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
              <AssetCodeChip code={asset.code} className="text-[11px]" />
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-[22px]">
              <div className="mb-6 grid grid-cols-2 gap-x-5 gap-y-3.5">
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                    Location
                  </div>
                  <div className="text-sm">{asset.locationName}</div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                    Category
                  </div>
                  <div className="text-sm">{asset.category}</div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                    Make / model
                  </div>
                  <div className="text-sm">{asset.makeModel ?? "—"}</div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                    Supplier
                  </div>
                  <div className="text-sm text-muted-foreground">{asset.supplier ?? "—"}</div>
                </div>
              </div>

              <div className="mb-[22px] rounded-xl border border-border px-4 py-3.5">
                <div className="mb-3 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                  Quantity &amp; condition
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="font-mono text-2xl font-medium text-status-good">{asset.good}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">Good</div>
                  </div>
                  <div>
                    <div className="font-mono text-2xl font-medium text-status-fair">{asset.fair}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">Fair</div>
                  </div>
                  <div>
                    <div className="font-mono text-2xl font-medium text-status-bad">{asset.bad}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">Bad</div>
                  </div>
                </div>
              </div>

              <div className="mb-3 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                Condition history
              </div>
              {asset.history.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">No verification snapshots yet.</p>
              ) : (
                <div className="relative pl-4">
                  <div className="absolute top-1 bottom-2 left-[3px] w-0.5 bg-border" />
                  {asset.history.map((h, i) => (
                    <div key={i} className="relative mb-4 last:mb-0">
                      <span className="absolute top-[3px] -left-4 size-2 rounded-full border-2 border-card bg-[#123C7A]" />
                      <div className="font-mono text-[12.5px] font-semibold">{h.date}</div>
                      <div className="mt-0.5 text-[12.5px] text-muted-foreground">{h.summary}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {canEdit && (
              <div className="flex flex-none gap-2 border-t border-border p-3.5">
                <Button variant="outline" className="flex-1" onClick={() => toast("Edit — not wired up yet")}>
                  Edit
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => toast("Adjust condition — not wired up yet")}>
                  Adjust condition
                </Button>
                <Button
                  variant="outline"
                  className="text-status-bad"
                  onClick={() => toast("Delete — not wired up yet")}
                >
                  Delete
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
