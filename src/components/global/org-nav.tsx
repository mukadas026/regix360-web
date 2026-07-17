"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { deleteCookie } from "cookies-next";
import {
  Activity,
  ChevronLeft,
  ClipboardCheck,
  FileBarChart,
  LayoutDashboard,
  LogOut,
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
import { TOKEN_COOKIE } from "@/api/client";
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

const roleLabels = { org_admin: "Org admin", asset_manager: "Asset manager", viewer: "Viewer" };

const COLLAPSE_STORAGE_KEY = "org-nav-collapsed";

function noopSubscribe() {
  return () => {};
}

function getStoredCollapsed() {
  return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
}

function getServerCollapsed() {
  return false;
}

function OrgIdentity({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 px-2 pt-1.5 pb-[18px]", collapsed && "justify-center px-0")}>
      <div className="flex size-7 flex-none items-center justify-center rounded-lg bg-white font-heading text-sm font-bold text-sidebar">
        {mockOrg.name.charAt(0)}
      </div>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <div className="truncate font-heading text-[13px] font-semibold text-sidebar-foreground">{mockOrg.name}</div>
          <div className="text-[11px] text-sidebar-foreground/60">{mockOrg.plan}</div>
        </div>
      )}
    </div>
  );
}

function NavLinks({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
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
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-[9px] text-[13.5px] font-medium",
              collapsed && "justify-center px-0",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/85 hover:bg-white/10 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4 flex-none" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter({ collapsed }: { collapsed?: boolean }) {
  const { role } = useSession();
  const router = useRouter();

  function signOut() {
    deleteCookie(TOKEN_COOKIE);
    router.push("/login");
  }

  return (
    <div className={cn("mt-auto flex items-center gap-2.5 border-t border-sidebar-border pt-3", collapsed && "justify-center")}>
      <div className="flex size-[30px] flex-none items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
        AM
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[12.5px] font-semibold text-sidebar-foreground">Ama Mensah</div>
          <div className="text-[11px] text-sidebar-foreground/60 capitalize">{roleLabels[role]}</div>
        </div>
      )}
      <button
        onClick={signOut}
        title="Sign out"
        className="flex-none rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground"
      >
        <LogOut size={15} />
      </button>
    </div>
  );
}

export function OrgNav() {
  const storedCollapsed = useSyncExternalStore(noopSubscribe, getStoredCollapsed, getServerCollapsed);
  const [override, setOverride] = useState<boolean | null>(null);
  const collapsed = override ?? storedCollapsed;

  function toggle() {
    const next = !collapsed;
    localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
    setOverride(next);
  }

  return (
    <aside
      className={cn(
        "relative hidden flex-none flex-col bg-sidebar p-3 transition-[width] duration-200 lg:flex",
        collapsed ? "w-[76px]" : "w-[228px]",
      )}
    >
      <OrgIdentity collapsed={collapsed} />
      <NavLinks collapsed={collapsed} />
      <UserFooter collapsed={collapsed} />

      <button
        onClick={toggle}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute top-16 -right-3 z-10 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground"
      >
        <ChevronLeft className={cn("size-3.5 transition-transform", collapsed && "rotate-180")} />
      </button>
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
        <SheetContent side="left" className="flex w-[260px] flex-col bg-sidebar p-3">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <OrgIdentity />
          <NavLinks onNavigate={() => setOpen(false)} />
          <UserFooter />
        </SheetContent>
      </Sheet>
    </div>
  );
}
