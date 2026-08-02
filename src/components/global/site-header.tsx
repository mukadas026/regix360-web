"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/">
          <Image src="/logo.png" alt="Regix360" width={2111} height={524} className="h-7 w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <Link href="/#features" className="text-sm font-medium text-foreground hover:text-primary">
            Features
          </Link>
          <NavDropdown label="Solutions" items={["By Industry", "By Department", "Integrations"]} />
          <Link href="/#sectors" className="text-sm font-medium text-foreground hover:text-primary">
            Industries
          </Link>
          <Link href="/coming-soon" className="text-sm font-medium text-foreground hover:text-primary">
            Pricing
          </Link>
          <NavDropdown label="Resources" items={["Blogs", "Guides", "Case Studies", "Support"]} />
          <Link href="/coming-soon" className="text-sm font-medium text-foreground hover:text-primary">
            About Us
          </Link>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="text-sm font-medium text-foreground hover:text-primary">
            Login
          </Link>
          <Button asChild>
            <Link href="/book-a-demo">Book a Demo</Link>
          </Button>
        </div>

        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-lg text-foreground lg:hidden"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle menu"
        >
          {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileNavOpen && (
        <nav className="flex animate-in flex-col gap-1 border-t border-border px-6 py-4 fade-in slide-in-from-top-2 duration-200 lg:hidden">
          <Link href="/#features" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted">
            Features
          </Link>
          <Link href="/#sectors" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted">
            Industries
          </Link>
          <Link href="/coming-soon" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted">
            Pricing
          </Link>
          <Link href="/coming-soon" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted">
            About Us
          </Link>
          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
            <Link href="/login" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted">
              Login
            </Link>
            <Button asChild className="w-full">
              <Link href="/book-a-demo">Book a Demo</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}

function NavDropdown({ label, items }: { label: string; items: string[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-foreground outline-none hover:text-primary">
        {label}
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {items.map((item) => (
          <DropdownMenuItem key={item} asChild>
            <Link href="/coming-soon">{item}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
