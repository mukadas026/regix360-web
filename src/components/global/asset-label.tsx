import { QRCodeSVG } from "qrcode.react";
import type { Organization } from "@/types/asset-platform";
import { cn } from "@/lib/utils";

type LabelAsset = {
  code: string;
};

export function AssetLabel({ asset, org, className }: { asset: LabelAsset; org: Organization | undefined; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-[360px] px-2 py-1 text-neutral-900", className)}>
      <div className="mb-2.5 text-center leading-tight">
        <div className="text-[10px] font-semibold text-neutral-700">Property of</div>
        <div className="font-heading text-[13.5px] font-extrabold tracking-tight text-neutral-900">{org?.name ?? "—"}</div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <div className="flex size-[92px] flex-none items-center justify-center overflow-hidden rounded-full bg-white">
          {org?.logoUrl ? (
            <img src={org.logoUrl} alt="" className="size-full object-contain p-1.5" />
          ) : (
            <span className="font-heading text-2xl font-extrabold text-neutral-900">{org?.name?.charAt(0) ?? "?"}</span>
          )}
        </div>

        <QRCodeSVG value={asset.code} size={92} />
      </div>

      <div className="mt-2.5 border-t-2 border-neutral-900/15 pt-1.5 text-center font-mono text-[15px] font-extrabold tracking-wide text-neutral-900">
        {asset.code}
      </div>
    </div>
  );
}
