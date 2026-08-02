"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Barcode,
  Repeat,
  Wrench,
  DollarSign,
  BarChart3,
  ShieldCheck,
  Landmark,
  GraduationCap,
  HeartPulse,
  Factory,
  Building2,
  Truck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/global/site-header";
import { SiteFooter } from "@/components/global/site-footer";

const FEATURES = [
  {
    icon: Barcode,
    title: "Asset Tracking",
    description: "Track assets in real-time with QR codes, barcodes and RFID.",
  },
  {
    icon: Repeat,
    title: "Lifecycle Management",
    description: "Manage assets from procurement to disposal seamlessly.",
  },
  {
    icon: Wrench,
    title: "Maintenance Management",
    description: "Schedule maintenance, set reminders and reduce downtime.",
  },
  {
    icon: DollarSign,
    title: "Depreciation & Valuation",
    description: "Automate depreciation calculations and track asset value.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "Make data-driven decisions with powerful reports and dashboards.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Audit",
    description: "Maintain compliance and be audit-ready at all times.",
  },
];

const SECTORS = [
  { icon: Landmark, label: "Government & Public" },
  { icon: GraduationCap, label: "Education" },
  { icon: HeartPulse, label: "Healthcare" },
  { icon: Factory, label: "Manufacturing" },
  { icon: Building2, label: "Real Estate" },
  { icon: Truck, label: "Transportation" },
];

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        visible ? "animate-in fade-in slide-in-from-bottom-6 fill-mode-both duration-700" : "opacity-0",
        className,
      )}
      style={visible ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <Sectors />
        <StatsBanner />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both">
          <span className="mb-4 inline-block rounded-full border border-border px-3 py-1 text-xs font-semibold tracking-wide text-primary">
            SMART ASSET MANAGEMENT. BETTER DECISIONS.
          </span>
          <h1 className="mb-4 font-heading text-4xl font-extrabold tracking-tight lg:text-5xl">
            Manage Every Asset.
            <br />
            Maximize Every <span className="text-primary">Value.</span>
          </h1>
          <p className="mb-6 max-w-md text-muted-foreground">
            Regix360 is a powerful asset management software designed for the private and public
            sector to track, manage and optimize assets across their entire lifecycle.
          </p>
          <div className="mb-10 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/book-a-demo">
                Book a Demo
                <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Explore Features</Link>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <HeroPoint title="Track in Real-Time" description="Get real-time visibility of all your assets" />
            <HeroPoint title="Improve Efficiency" description="Automate processes and reduce operational costs" />
            <HeroPoint title="Ensure Compliance" description="Stay audit-ready with accurate data" />
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

function HeroPoint({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <ShieldCheck className="size-4" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative animate-[float_6s_ease-in-out_infinite]">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl transition-shadow duration-500 hover:shadow-primary/20">
        <div className="flex">
          <div className="hidden w-40 flex-none flex-col gap-1 bg-foreground p-4 text-background sm:flex">
            <span className="mb-4 font-heading text-sm font-bold">REGIX360</span>
            {["Dashboard", "Assets", "Locations", "Maintenance", "Transfers", "Depreciation", "Reports", "Alerts", "Settings"].map(
              (item, i) => (
                <span
                  key={item}
                  className={`rounded-md px-2 py-1.5 text-xs ${i === 0 ? "bg-primary text-primary-foreground" : "text-background/70"}`}
                >
                  {item}
                </span>
              ),
            )}
          </div>

          <div className="flex-1 space-y-3 p-4">
            <p className="text-sm font-semibold">Dashboard</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MockStat label="Total Assets" value="12,458" />
              <MockStat label="Active Assets" value="10,862" />
              <MockStat label="Under Maintenance" value="1,245" />
              <MockStat label="Retired Assets" value="351" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Asset Category</p>
                <div className="mx-auto size-16 rounded-full border-8 border-primary border-r-emerald-400 border-b-emerald-400" />
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Assets by Status</p>
                <div className="flex h-16 items-end gap-1.5">
                  <div className="h-full w-3 rounded-sm bg-primary" />
                  <div className="h-2/3 w-3 rounded-sm bg-emerald-400" />
                  <div className="h-1/3 w-3 rounded-sm bg-muted-foreground/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-6 hidden animate-in rounded-lg border border-border bg-card p-3 shadow-xl fade-in slide-in-from-left-4 duration-700 delay-500 fill-mode-both sm:block">
        <p className="text-xs font-semibold">Asset Transferred</p>
        <p className="text-[11px] text-muted-foreground">Office Chair · HQ to Branch</p>
      </div>
    </div>
  );
}

function MockStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-heading text-base font-bold">{value}</p>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
      <Reveal className="mb-12 text-center">
        <p className="mb-2 text-sm font-semibold text-primary">POWERFUL FEATURES</p>
        <h2 className="font-heading text-3xl font-bold tracking-tight">
          Everything You Need to Manage Assets Smarter
        </h2>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <Reveal key={feature.title} delay={i * 75}>
            <div className="h-full rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </div>
              <p className="mb-1 font-heading text-base font-semibold">{feature.title}</p>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Sectors() {
  return (
    <section id="sectors" className="bg-secondary/50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <Reveal>
          <p className="mb-2 text-sm font-semibold text-primary">BUILT FOR EVERY SECTOR</p>
          <h2 className="mb-10 font-heading text-3xl font-bold tracking-tight">
            Trusted by Private & Public Sector Organizations
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {SECTORS.map((sector, i) => (
            <Reveal key={sector.label} delay={i * 75} className="flex flex-col items-center gap-3">
              <div className="group flex size-14 items-center justify-center rounded-full border border-border bg-card transition-transform duration-300 hover:scale-110 hover:border-primary/40">
                <sector.icon className="size-6 text-primary transition-transform duration-300 group-hover:scale-110" />
              </div>
              <p className="text-sm font-medium">{sector.label}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">...and many more</p>
      </div>
    </section>
  );
}

function StatsBanner() {
  return (
    <section id="demo" className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-6 py-14 lg:flex-row lg:justify-between">
        <Reveal className="max-w-md text-center lg:text-left">
          <h2 className="mb-2 font-heading text-2xl font-bold">One Platform. Total Asset Control.</h2>
          <p className="mb-6 text-sm text-primary-foreground/80">
            Regix360 helps organizations improve visibility, reduce costs, ensure compliance and make
            smarter decisions.
          </p>
          <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/book-a-demo">Book a Demo</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <Link href="/talk-to-sales">Talk to Sales</Link>
            </Button>
          </div>
        </Reveal>

        <div className="flex gap-10">
          <Reveal delay={0}>
            <Stat value="500+" label="Organizations" />
          </Reveal>
          <Reveal delay={100}>
            <Stat value="50,000+" label="Assets Managed" />
          </Reveal>
          <Reveal delay={200}>
            <Stat value="99.9%" label="Uptime" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-heading text-2xl font-bold">{value}</p>
      <p className="text-xs text-primary-foreground/80">{label}</p>
    </div>
  );
}

