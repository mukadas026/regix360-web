"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { getAsset } from "@/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssetLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: asset, isPending } = useQuery({ queryKey: getAsset.key(id), queryFn: () => getAsset.fn(id) });

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-6 print:bg-white">
        <Skeleton className="h-[480px] w-[380px]" />
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
      <div className="w-full max-w-[380px] rounded-md border border-border bg-white p-8 text-center print:border-black">
        <h1 className="mb-1 font-heading text-xl font-bold">{asset.description}</h1>
        <p className="mb-6 text-[15px] font-semibold">Asset Code: {asset.code}</p>

        <div className="mb-6 flex justify-center">
          <QRCodeSVG value={asset.code} size={220} />
        </div>

        <dl className="space-y-1.5 text-left text-sm">
          <div className="flex justify-between gap-3">
            <dt className="font-semibold">Category:</dt>
            <dd>{asset.category}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold">Location:</dt>
            <dd>
              {asset.location_name} / {asset.department_name}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold">Condition:</dt>
            <dd className="capitalize">{asset.condition}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold">Status:</dt>
            <dd className="capitalize">{asset.status.replace("_", " ")}</dd>
          </div>
        </dl>
      </div>

      <Button onClick={() => window.print()} className="print:hidden">
        Print
      </Button>
    </div>
  );
}
