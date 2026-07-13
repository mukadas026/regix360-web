import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  caption,
  className,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  caption?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </div>
      {value !== undefined && (
        <div className="font-mono text-3xl leading-none font-medium">{value}</div>
      )}
      {children}
      {caption && <div className="mt-1.5 text-xs text-muted-foreground">{caption}</div>}
    </div>
  );
}
