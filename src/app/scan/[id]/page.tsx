"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublicAsset } from "@/api";
import type { AssetStatus, Condition } from "@/types/asset-platform";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function AssetScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: asset, isPending, isError } = useQuery({
    queryKey: getPublicAsset.key(id),
    queryFn: () => getPublicAsset.fn(id),
    retry: false,
  });

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
        <Skeleton className="h-[280px] w-full max-w-[380px]" />
      </div>
    );
  }

  if (isError || !asset) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-6 text-sm text-muted-foreground">
        Asset not found.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <div className="w-full max-w-[380px] rounded-lg border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-3">
          {asset.org_logo_url ? (
            <img src={asset.org_logo_url} alt="" className="size-10 flex-none rounded-full object-contain" />
          ) : (
            <div className="flex size-10 flex-none items-center justify-center rounded-full bg-secondary font-heading text-lg font-extrabold">
              {asset.org_name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground">Property of</div>
            <div className="truncate font-heading text-sm font-semibold">{asset.org_name}</div>
          </div>
        </div>

        <h1 className="mb-1 font-heading text-lg font-semibold">{asset.description}</h1>
        <p className="mb-4 font-mono text-[13px] text-muted-foreground">{asset.code}</p>

        <div className="mb-4 flex items-center gap-2">
          <Badge variant={conditionBadgeVariant[asset.condition]} className="capitalize">
            {asset.condition}
          </Badge>
          <Badge variant="outline">{statusLabel[asset.status]}</Badge>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-border pt-4 text-[13px]">
          <div>
            <dt className="text-[11px] text-muted-foreground">Category</dt>
            <dd className="font-medium">{asset.category}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Location</dt>
            <dd className="font-medium">{asset.location_name}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Department</dt>
            <dd className="font-medium">{asset.department_name}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
