"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { setCookie } from "cookies-next";
import { signIn } from "@/api";
import { TOKEN_COOKIE } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: signIn.fn,
    onSuccess: (session) => {
      setCookie(TOKEN_COOKIE, session.access_token, { maxAge: session.expires_in });
      router.push("/dashboard");
    },
    onError: (err) => {
      setError((err as { message?: string })?.message ?? "Something went wrong.");
    },
  });

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 items-center justify-center bg-secondary lg:flex">
        <Image
          src="/login-splash.png"
          alt=""
          width={2016}
          height={1260}
          className="h-full w-full object-cover"
          priority
        />
      </div>

      <div className="flex flex-1 items-center justify-center bg-secondary p-6 lg:bg-background">
        <div className="w-full max-w-[380px]">
          <div className="mb-7">
            <Image src="/logo.png" alt="Regix360" width={2111} height={524} className="h-8 w-auto" priority />
          </div>
          <form
            className="rounded-lg border border-border bg-card p-[30px] lg:border-none lg:p-0"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              mutate({ email, password });
            }}
          >
            <h1 className="mb-1 font-heading text-[22px] font-semibold tracking-tight">Sign in</h1>
            <p className="mb-[22px] text-sm text-muted-foreground">Sign in to your organization&apos;s register</p>

            {error && (
              <div className="mb-4 rounded-md border border-status-bad/30 bg-status-bad/10 px-3 py-2 text-[13px] text-status-bad">
                {error}
              </div>
            )}

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
              className="mb-4"
            />

            <Label htmlFor="password" className="mb-1.5 text-xs font-semibold">
              Password
            </Label>
            <PasswordInput
              id="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-5"
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Signing in…" : "Sign in"}
            </Button>

            <div className="mt-4 text-center text-[13px]">
              <a href="#" className="text-accent-foreground hover:underline">
                Forgot password
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
