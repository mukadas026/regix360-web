"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/global/site-header";
import { SiteFooter } from "@/components/global/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DEMO_EMAIL = "sales@regix360.com";

export default function BookADemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    workEmail: "",
    company: "",
    teamSize: "",
    message: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const subject = `Demo request from ${form.company || form.fullName}`;
    const body = [
      `Name: ${form.fullName}`,
      `Work email: ${form.workEmail}`,
      `Company: ${form.company}`,
      `Team size: ${form.teamSize || "Not specified"}`,
      "",
      form.message || "No additional message.",
    ].join("\n");

    window.location.href = `mailto:${DEMO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-6 py-16 lg:py-24">
          <div className="mb-10 text-center">
            <span className="mb-4 inline-block rounded-full border border-border px-3 py-1 text-xs font-semibold tracking-wide text-primary">
              BOOK A DEMO
            </span>
            <h1 className="mb-3 font-heading text-3xl font-bold tracking-tight lg:text-4xl">
              See Regix360 in Action
            </h1>
            <p className="text-muted-foreground">
              Tell us a bit about your organization and we&apos;ll set up a walkthrough tailored to your
              asset management needs.
            </p>
          </div>

          {submitted ? (
            <div className="animate-in flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center fade-in zoom-in-95 duration-300">
              <CheckCircle2 className="size-10 text-primary" />
              <p className="font-heading text-lg font-semibold">Thanks, {form.fullName.split(" ")[0] || "there"}!</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Your email client should have opened with your request pre-filled. Send it over and our team
                will be in touch shortly.
              </p>
              <Button variant="outline" onClick={() => setSubmitted(false)}>
                Submit another request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 lg:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="workEmail">Work email</Label>
                  <Input
                    id="workEmail"
                    type="email"
                    required
                    value={form.workEmail}
                    onChange={(e) => setForm({ ...form, workEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="company">Company name</Label>
                  <Input
                    id="company"
                    required
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="teamSize">Approx. number of assets</Label>
                  <Input
                    id="teamSize"
                    placeholder="e.g. 500 - 1,000"
                    value={form.teamSize}
                    onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">What would you like to cover?</Label>
                <Textarea
                  id="message"
                  rows={4}
                  placeholder="Tell us about your current process and what you're hoping to solve."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                Request a Demo
              </Button>
            </form>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
