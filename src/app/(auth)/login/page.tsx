"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
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
            router.push("/dashboard");
          }}
        >
          <h1 className="mb-1 font-heading text-[22px] font-semibold tracking-tight">Sign in</h1>
          <p className="mb-[22px] text-sm text-muted-foreground">Cornerstone Faith Community Church</p>

          <Label htmlFor="email" className="mb-1.5 text-xs font-semibold">
            Email
          </Label>
          <Input id="email" defaultValue="admin@cornerstonefcc.org" className="mb-4" />

          <Label htmlFor="password" className="mb-1.5 text-xs font-semibold">
            Password
          </Label>
          <Input id="password" type="password" defaultValue="passwordpass" className="mb-5" />

          <Button type="submit" className="w-full">
            Sign in
          </Button>

          <div className="mt-4 flex justify-between text-[13px]">
            <a href="#" className="text-accent-foreground hover:underline">
              Forgot password
            </a>
            <Link href="/signup" className="font-semibold text-accent-foreground hover:underline">
              Create an organization →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
