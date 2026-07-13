"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

export default function SetupWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <div className="w-full max-w-[480px]">
        <div className="mb-[18px] flex items-center justify-center gap-2">
          {[1, 2, 3].map((dot) => (
            <span
              key={dot}
              className={cn("h-1 w-7 rounded-full", dot <= step ? "bg-primary" : "bg-border")}
            />
          ))}
        </div>

        <div className="rounded-[10px] border border-border bg-card p-8">
          {step === 1 && (
            <div>
              <div className="mb-2 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Step 1 of 3
              </div>
              <h1 className="mb-1.5 font-heading text-[22px] font-semibold">Add your first location</h1>
              <p className="mb-5 text-sm text-muted-foreground">
                An organization usually has at least one — a branch, office, or site.
              </p>
              <Label className="mb-1.5 text-[12.5px] font-semibold">Location name</Label>
              <Input placeholder="e.g. Agbogba" className="mb-3.5" />
              <Label className="mb-1.5 text-[12.5px] font-semibold">
                Address <span className="font-normal text-muted-foreground">— optional</span>
              </Label>
              <Input placeholder="Agbogba Junction, Accra" className="mb-[22px]" />
              <Button className="w-full" onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-2 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Step 2 of 3
              </div>
              <h1 className="mb-1.5 font-heading text-[22px] font-semibold">Add your assets</h1>
              <p className="mb-5 text-sm text-muted-foreground">
                Bring in your whole register at once, or add a single asset by hand.
              </p>
              <button
                onClick={() => setStep(3)}
                className="mb-3 w-full rounded-lg border border-[#CFE0F7] bg-accent p-[18px] text-left"
              >
                <div className="mb-1 flex items-center gap-2.5">
                  <span className="text-lg">⬆</span>
                  <span className="font-heading text-[15px] font-semibold">Upload from a spreadsheet</span>
                  <span className="ml-auto rounded-full border border-[#CFE0F7] bg-card px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    Recommended
                  </span>
                </div>
                <div className="text-[13px] text-muted-foreground">
                  We&apos;ll map your columns and reconcile before anything is saved.
                </div>
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-full rounded-lg border border-border p-[18px] text-left"
              >
                <div className="mb-1 flex items-center gap-2.5">
                  <span className="text-lg">＋</span>
                  <span className="font-heading text-[15px] font-semibold">Add one manually</span>
                </div>
                <div className="text-[13px] text-muted-foreground">Enter a single asset&apos;s details by hand.</div>
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="py-2 text-center">
              <div className="mx-auto mb-4 flex size-[52px] items-center justify-center rounded-full bg-[#EAF3EE] text-[26px] text-status-good">
                ✓
              </div>
              <h1 className="mb-1.5 font-heading text-[22px] font-semibold">Your register is ready</h1>
              <p className="mb-5 text-sm text-muted-foreground">
                Everything from here lives in one trustworthy record.
              </p>
              <Button className="w-full" onClick={() => router.push("/dashboard")}>
                Go to dashboard
              </Button>
            </div>
          )}
        </div>

        <div className="mt-3.5 text-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-[13px] font-semibold text-muted-foreground"
          >
            Skip setup
          </button>
        </div>
      </div>
    </div>
  );
}
