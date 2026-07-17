"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ClipboardCheck,
  FileBarChart,
  LayoutDashboard,
  MapPin,
  Menu,
  Network,
  Package,
  Repeat,
  Settings,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockOrg } from "@/lib/mock-data";
import { useSession } from "@/providers/session-provider";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Package },
  { href: "/users", label: "Users", icon: Users },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/departments", label: "Departments", icon: Network },
  { href: "/verification", label: "Verification", icon: ClipboardCheck },
  { href: "/transfers", label: "Transfers", icon: Repeat },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/disposal", label: "Disposal", icon: Trash2 },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/activity-logs", label: "Activity Logs", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

const roleLabels = { admin: "Org admin", asset_manager: "Asset manager", viewer: "Viewer" };

function OrgIdentity() {
  return (
    <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-[18px]">
      <div className="flex size-7 items-center justify-center rounded-lg bg-[#123C7A] font-heading text-sm font-bold text-white">
        {mockOrg.name.charAt(0)}
      </div>
      <div className="leading-tight">
        <div className="font-heading text-[13px] font-semibold">{mockOrg.name}</div>
        <div className="text-[11px] text-muted-foreground">{mockOrg.plan}</div>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium",
              active ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-secondary",
            )}
          >
            <Icon className="size-[15px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter() {
  const { role } = useSession();

  return (
    <div className="mt-auto flex items-center gap-2.5 border-t border-border pt-3">
      <div className="flex size-[30px] items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
        AM
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="text-[12.5px] font-semibold">Ama Mensah</div>
        <div className="text-[11px] text-muted-foreground capitalize">{roleLabels[role]}</div>
      </div>
    </div>
  );
}

export function OrgNav() {
  return (
    <aside className="hidden w-[228px] flex-none flex-col border-r border-border bg-card p-3 lg:flex">
      <OrgIdentity />
      <NavLinks />
      <UserFooter />
    </aside>
  );
}

export function MobileTopBar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-none items-center justify-between border-b border-border bg-card px-4 py-2.5 lg:hidden">
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-md bg-[#123C7A] font-heading text-xs font-bold text-white">
          {mockOrg.name.charAt(0)}
        </div>
        <span className="font-heading text-[13px] font-semibold">{mockOrg.name}</span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)}>
          <Menu className="size-[18px]" />
        </Button>
        <SheetContent side="left" className="flex w-[260px] flex-col p-3">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <OrgIdentity />
          <NavLinks onNavigate={() => setOpen(false)} />
          <UserFooter />
        </SheetContent>
      </Sheet>
    </div>
  );
}
