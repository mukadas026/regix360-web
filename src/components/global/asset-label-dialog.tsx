"use client";

import { useQuery } from "@tanstack/react-query";
import { getAsset, getOrganization } from "@/api";
import { AppDialog } from "@/components/global/app-dialog";
import { AssetLabel } from "@/components/global/asset-label";
import { Button } from "@/components/ui/button";

export function AssetLabelDialog({
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
  const { data: org } = useQuery({ queryKey: getOrganization.key, queryFn: getOrganization.fn, enabled: open });

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      kind="modal"
      title="Asset label"
      contentClassName="sm:max-w-[380px]"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {unitId && (
            <Button onClick={() => window.open(`/labels/${unitId}`, "_blank")}>Open for printing</Button>
          )}
        </>
      }
    >
      {isPending || !asset ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : (
        <AssetLabel asset={asset} org={org} />
      )}
    </AppDialog>
  );
}
