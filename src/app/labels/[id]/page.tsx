"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAsset, getOrganization } from "@/api";
import { AssetLabel } from "@/components/global/asset-label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssetLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: asset, isPending } = useQuery({ queryKey: getAsset.key(id), queryFn: () => getAsset.fn(id) });
  const { data: org } = useQuery({ queryKey: getOrganization.key, queryFn: getOrganization.fn });

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-6 print:bg-white">
        <Skeleton className="h-[420px] w-[320px]" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-6 text-sm text-muted-foreground">
        Asset not found.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-secondary p-6 print:bg-white">
      <AssetLabel asset={asset} org={org} />

      <Button onClick={() => window.print()} className="print:hidden">
        Print
      </Button>
    </div>
  );
}
