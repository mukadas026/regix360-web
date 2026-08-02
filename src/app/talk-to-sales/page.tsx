"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/global/site-header";
import { SiteFooter } from "@/components/global/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SALES_EMAIL = "sales@regix360.com";

export default function TalkToSalesPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    workEmail: "",
    company: "",
    message: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const subject = `Sales inquiry from ${form.company || form.fullName}`;
    const body = [
      `Name: ${form.fullName}`,
      `Work email: ${form.workEmail}`,
      `Company: ${form.company}`,
      "",
      form.message || "No additional message.",
    ].join("\n");

    window.location.href = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-6 py-16 lg:py-24">
          <div className="mb-10 text-center">
            <span className="mb-4 inline-block rounded-full border border-border px-3 py-1 text-xs font-semibold tracking-wide text-primary">
              TALK TO SALES
            </span>
            <h1 className="mb-3 font-heading text-3xl font-bold tracking-tight lg:text-4xl">
              Let&apos;s Find the Right Plan
            </h1>
            <p className="text-muted-foreground">
              Have questions about pricing, rollout, or enterprise needs? Reach out and our sales team
              will get back to you.
            </p>
          </div>

          {submitted ? (
            <div className="animate-in flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center fade-in zoom-in-95 duration-300">
              <CheckCircle2 className="size-10 text-primary" />
              <p className="font-heading text-lg font-semibold">Thanks, {form.fullName.split(" ")[0] || "there"}!</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Your email client should have opened with your message pre-filled. Send it over and we&apos;ll
                follow up shortly.
              </p>
              <Button variant="outline" onClick={() => setSubmitted(false)}>
                Send another message
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
                <Label htmlFor="message">How can we help?</Label>
                <Textarea
                  id="message"
                  rows={4}
                  placeholder="Pricing, enterprise rollout, custom requirements..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                Contact Sales
              </Button>
            </form>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
