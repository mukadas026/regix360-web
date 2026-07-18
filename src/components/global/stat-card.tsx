import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  caption,
  icon,
  className,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  caption?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="mb-3 flex items-center gap-2.5">
        {icon && (
          <span className="flex size-8 flex-none items-center justify-center rounded-full bg-secondary text-muted-foreground">
            {icon}
          </span>
        )}
        <div className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{label}</div>
      </div>
      {value !== undefined && <div className="font-mono text-2xl leading-none font-semibold">{value}</div>}
      {children}
      {caption && <div className="mt-1.5 text-xs text-muted-foreground">{caption}</div>}
    </div>
  );
}
