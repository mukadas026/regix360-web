"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getOrg } from "@/api";
import { PageContainer } from "@/components/global/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/providers/session-provider";

export default function SettingsPage() {
  const { isAdmin } = useSession();
  const { data: org } = useQuery({ queryKey: getOrg.key, queryFn: getOrg.fn });

  return (
    <PageContainer>
      <h1 className="mb-[22px] font-heading text-2xl font-semibold tracking-tight">Settings</h1>

      <div className="mb-4 rounded-xl border border-border bg-card px-6 py-[22px]">
        <div className="mb-4 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Organization
        </div>
        {!org ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 text-[12.5px] font-semibold">Name</Label>
              <Input defaultValue={org.name} />
            </div>
            <div>
              <Label className="mb-1.5 text-[12.5px] font-semibold">Contact email</Label>
              <Input defaultValue={org.contactEmail} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-[12.5px] font-semibold">Address</Label>
              <Input defaultValue={org.address} />
            </div>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-6 py-[18px]">
          <div>
            <div className="text-[13.5px] font-medium">Users &amp; roles</div>
            <p className="text-xs text-muted-foreground">Manage members, roles, and pending invites.</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/users">Go to Users →</Link>
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
