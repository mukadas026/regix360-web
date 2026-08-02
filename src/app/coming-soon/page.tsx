import Link from "next/link";
import { Construction } from "lucide-react";
import { SiteHeader } from "@/components/global/site-header";
import { SiteFooter } from "@/components/global/site-footer";
import { Button } from "@/components/ui/button";

export default function ComingSoonPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Construction className="size-7" />
        </div>
        <div>
          <span className="mb-4 inline-block rounded-full border border-border px-3 py-1 text-xs font-semibold tracking-wide text-primary">
            COMING SOON
          </span>
          <h1 className="font-heading text-3xl font-bold tracking-tight lg:text-4xl">
            We&apos;re Still Building This Page
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            This part of the site isn&apos;t ready yet. In the meantime, take a look at what Regix360 can
            already do for your organization.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/#features">Explore Features</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
