"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <div className="w-full max-w-[380px]">
        <div className="mb-7 flex items-center gap-2.5">
          <div className="flex size-[30px] items-center justify-center rounded-md bg-[#123C7A] font-heading text-[15px] font-bold text-white">
            L
          </div>
          <span className="font-heading text-[17px] font-semibold tracking-tight">Ledger</span>
        </div>
        <form
          className="rounded-lg border border-border bg-card p-[30px]"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/setup");
          }}
        >
          <h1 className="mb-1 font-heading text-[22px] font-semibold tracking-tight">Create an organization</h1>
          <p className="mb-[22px] text-sm text-muted-foreground">
            Get your register set up in a few minutes.
          </p>

          <Label htmlFor="org" className="mb-1.5 text-xs font-semibold">
            Organization name
          </Label>
          <Input id="org" placeholder="e.g. Cornerstone Faith Community Church" className="mb-4" />

          <Label htmlFor="name" className="mb-1.5 text-xs font-semibold">
            Your name
          </Label>
          <Input id="name" placeholder="e.g. Ama Mensah" className="mb-4" />

          <Label htmlFor="signup-email" className="mb-1.5 text-xs font-semibold">
            Email
          </Label>
          <Input id="signup-email" type="email" placeholder="you@organization.org" className="mb-4" />

          <Label htmlFor="signup-password" className="mb-1.5 text-xs font-semibold">
            Password
          </Label>
          <Input id="signup-password" type="password" className="mb-5" />

          <Button type="submit" className="w-full">
            Create organization
          </Button>

          <div className="mt-4 text-center text-[13px]">
            <Link href="/login" className="font-semibold text-accent-foreground hover:underline">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
