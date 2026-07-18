"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { setCookie } from "cookies-next";
import { acceptInvite } from "@/api";
import { TOKEN_COOKIE } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

function readInviteToken() {
  if (typeof window === "undefined") return null;
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  return hashParams.get("access_token") ?? searchParams.get("access_token");
}

export default function SetPasswordPage() {
  const router = useRouter();
  const [token] = useState(readInviteToken);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) setCookie(TOKEN_COOKIE, token);
  }, [token]);

  const { mutate, isPending } = useMutation({
    mutationFn: acceptInvite.fn,
    onSuccess: () => router.push("/dashboard"),
    onError: (err) => setError((err as { message?: string })?.message ?? "Something went wrong."),
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
        <div className="w-full max-w-[380px] rounded-lg border border-border bg-card p-[30px] text-center">
          <h1 className="mb-1.5 font-heading text-lg font-semibold">Invite link not found</h1>
          <p className="text-sm text-muted-foreground">
            This link is missing or expired. Ask your administrator to send a new invite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <div className="w-full max-w-[380px]">
        <div className="mb-7">
          <Image src="/logo.png" alt="Regix360" width={2111} height={524} className="h-8 w-auto" priority />
        </div>
        <form
          className="rounded-lg border border-border bg-card p-[30px]"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (password.length < 8) {
              setError("Password must be at least 8 characters.");
              return;
            }
            if (password !== confirmPassword) {
              setError("Passwords don't match.");
              return;
            }
            mutate({ password, fullName: fullName || undefined });
          }}
        >
          <h1 className="mb-1 font-heading text-[22px] font-semibold tracking-tight">Set your password</h1>
          <p className="mb-[22px] text-sm text-muted-foreground">Finish setting up your account to continue.</p>

          {error && (
            <div className="mb-4 rounded-md border border-status-bad/30 bg-status-bad/10 px-3 py-2 text-[13px] text-status-bad">
              {error}
            </div>
          )}

          <Label htmlFor="fullName" className="mb-1.5 text-xs font-semibold">
            Full name <span className="font-normal text-muted-foreground">— optional</span>
          </Label>
          <Input
            id="fullName"
            placeholder="e.g. Ama Mensah"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mb-4"
          />

          <Label htmlFor="password" className="mb-1.5 text-xs font-semibold">
            Password
          </Label>
          <PasswordInput
            id="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4"
          />

          <Label htmlFor="confirmPassword" className="mb-1.5 text-xs font-semibold">
            Confirm password
          </Label>
          <PasswordInput
            id="confirmPassword"
            required
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mb-5"
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Setting up…" : "Set password & continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
