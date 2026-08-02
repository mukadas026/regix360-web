"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-1">
          <Image
            src="/logo.png"
            alt="Regix360"
            width={2111}
            height={524}
            className="h-6 w-auto brightness-0 invert"
          />
          <p className="mt-3 text-sm text-background/70">
            Smart Asset Management Software for a Smarter Tomorrow.
          </p>
          <div className="mt-4 flex gap-3">
            <SocialIcon path="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
            <SocialIcon path="M14.5 8.5h2V5.5h-2c-2.2 0-3.5 1.4-3.5 3.5v2H9v3h2v6.5h3V14h2.2l.3-3H14v-1.5c0-.6.2-1 1-1Z" />
            <SocialIcon path="M21 6.4c-.7.3-1.4.5-2.1.6.8-.5 1.3-1.2 1.6-2.1-.7.4-1.5.7-2.4.9a3.7 3.7 0 0 0-6.3 3.4A10.5 10.5 0 0 1 4.3 5a3.7 3.7 0 0 0 1.1 5 3.6 3.6 0 0 1-1.7-.5v.1c0 1.8 1.3 3.3 3 3.6a3.7 3.7 0 0 1-1.7.1 3.7 3.7 0 0 0 3.4 2.6A7.4 7.4 0 0 1 3 17.4a10.4 10.4 0 0 0 5.7 1.7c6.8 0 10.6-5.8 10.6-10.8v-.5c.7-.5 1.4-1.2 1.7-2Z" />
            <SocialIcon path="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.9 4.7 12 4.7 12 4.7s-5.9 0-7.6.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.7.5 7.6.5 7.6.5s5.9 0 7.6-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.8ZM10 15V9l5.2 3-5.2 3Z" />
          </div>
        </div>

        <FooterColumn title="Product" items={["Features", "Pricing", "Integrations", "Updates"]} />
        <FooterColumn title="Solutions" items={["By Industry", "By Department", "Use Cases"]} />
        <FooterColumn title="Resources" items={["Blogs", "Guides", "Case Studies", "Support"]} />
        <FooterColumn title="Company" items={["About Us", "Careers", "Contact Us"]} />

        <div>
          <p className="mb-3 text-sm font-semibold">Newsletter</p>
          <p className="mb-3 text-sm text-background/70">Stay updated with the latest news and insights.</p>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <Input
              type="email"
              placeholder="Enter your email"
              className="border-background/20 bg-background/10 text-background placeholder:text-background/50"
            />
            <Button type="submit" size="icon">
              <ArrowRight />
            </Button>
          </form>
        </div>
      </div>

      <div className="border-t border-background/10 py-6 text-center text-xs text-background/60">
        © 2026 Regix360. All rights reserved.
      </div>
    </footer>
  );
}

function SocialIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-background/70" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item}>
            <Link href="/coming-soon" className="text-sm text-background/70 hover:text-background">
              {item}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
