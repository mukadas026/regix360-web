"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthIllustrationPanel } from "@/components/global/auth-illustration-panel";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex min-h-screen">
      <AuthIllustrationPanel />

      <div className="flex flex-1 items-center justify-center bg-secondary p-6 lg:bg-background">
        <div className="w-full max-w-[380px]">
          <div className="mb-7">
            <Image src="/logo.png" alt="Regix360" width={2111} height={524} className="h-8 w-auto" priority />
          </div>

          {submitted ? (
            <div className="rounded-lg border border-border bg-card p-[30px] text-center lg:border-none">
              <h1 className="mb-1.5 font-heading text-lg font-semibold">Check your email</h1>
              <p className="text-sm text-muted-foreground">
                If an account exists for {email}, we&apos;ve sent a link to reset your password.
              </p>
              <Link href="/login" className="mt-5 inline-block text-[13px] text-accent-foreground hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form
              className="rounded-lg border border-border bg-card p-[30px] lg:border-none lg:p-0"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <h1 className="mb-1 font-heading text-[22px] font-semibold tracking-tight">Forgot password</h1>
              <p className="mb-[22px] text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a link to reset it.
              </p>

              <Label htmlFor="email" className="mb-1.5 text-xs font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="you@organization.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-5"
              />

              <Button type="submit" className="w-full">
                Send reset link
              </Button>

              <div className="mt-4 text-center text-[13px]">
                <Link href="/login" className="text-accent-foreground hover:underline">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
