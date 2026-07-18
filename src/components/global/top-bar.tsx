"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronLeft, LogOut, Settings } from "lucide-react";
import { getPageInfo } from "@/lib/page-titles";
import { signOut } from "@/lib/sign-out";
import { useSession } from "@/providers/session-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const roleLabels = { org_admin: "Org admin", asset_manager: "Asset manager", viewer: "Viewer" };

function initialsFor(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, user } = useSession();
  const { title, backHref } = getPageInfo(pathname);

  return (
    <div className="flex flex-none items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2.5">
        {backHref && (
          <Link
            href={backHref}
            title="Back"
            className="flex size-8 flex-none cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft size={17} />
          </Link>
        )}
        <h1 className="truncate font-heading text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
      </div>

      <div className="flex flex-none items-center gap-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" title="Notifications">
              <Bell size={17} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <div className="mb-1 text-[13px] font-semibold">Notifications</div>
            <p className="text-[13px] text-muted-foreground">You&apos;re all caught up — nothing new right now.</p>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-accent text-[12.5px] font-semibold text-accent-foreground transition-colors duration-150 hover:bg-accent/70">
              {user ? initialsFor(user.fullName, user.email) : "…"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="truncate text-[13px] font-semibold text-foreground">{user?.fullName || user?.email || "…"}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
              <div className="mt-1 text-xs text-muted-foreground capitalize">{roleLabels[role]}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => signOut(router)}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
