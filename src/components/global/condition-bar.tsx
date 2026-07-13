import { cn } from "@/lib/utils";

type ConditionBarProps = {
  good: number;
  fair: number;
  bad: number;
  showLabel?: boolean;
  fullLabel?: boolean;
  className?: string;
};

export function ConditionBar({ good, fair, bad, showLabel = true, fullLabel = false, className }: ConditionBarProps) {
  const total = good + fair + bad || 1;
  const pct = (n: number) => `${Math.round((n / total) * 1000) / 10}%`;

  let label: string;
  if (fullLabel) {
    label = `${good} good · ${fair} fair · ${bad} bad`;
  } else {
    const dominant = [
      ["Good", good],
      ["Fair", fair],
      ["Bad", bad],
    ].sort((a, b) => (b[1] as number) - (a[1] as number))[0];
    label = `${dominant[0]} · ${dominant[1]}`;
  }

  return (
    <span className={cn("inline-flex w-full flex-col gap-1.5", className)}>
      <span className="flex h-[7px] w-full overflow-hidden rounded">
        <span className="bg-status-good" style={{ width: pct(good) }} />
        <span className="bg-status-fair" style={{ width: pct(fair) }} />
        <span className="bg-status-bad" style={{ width: pct(bad) }} />
      </span>
      {showLabel && (
        <span className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground">{label}</span>
      )}
    </span>
  );
}
