import { cn } from "@/lib/utils";

export function AssetCodeChip({ code, className }: { code: string; className?: string }) {
  const parts = code.split("/");

  return (
    <span
      className={cn(
        "inline-flex items-stretch rounded-lg border border-border bg-card font-mono leading-none",
        className,
      )}
    >
      {parts.map((part, i) => (
        <span key={i} className="flex items-center">
          <span className="px-[0.62em] py-[0.34em] text-[1em] tracking-[0.04em] whitespace-nowrap text-foreground">
            {part}
          </span>
          {i < parts.length - 1 && <span className="w-px bg-border" />}
        </span>
      ))}
    </span>
  );
}
