"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { getOrganization, updateOrganization, uploadOrganizationLogo } from "@/api";
import type { Organization } from "@/types/asset-platform";
import { PageContainer } from "@/components/global/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/providers/session-provider";

function OrgLogo({ org, isAdmin }: { org: Organization; isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: uploadLogo, isPending: isUploading } = useMutation({
    mutationFn: uploadOrganizationLogo.fn,
    onSuccess: (updated) => {
      queryClient.setQueryData(getOrganization.key, updated);
      toast("Logo updated");
    },
    onError: (error) => toast((error as { message?: string })?.message ?? "Something went wrong."),
  });

  return (
    <div className="flex items-center gap-4">
      {org.logoUrl ? (
        <img src={org.logoUrl} alt="" className="size-14 flex-none rounded-lg border border-border object-cover" />
      ) : (
        <div className="flex size-14 flex-none items-center justify-center rounded-lg border border-border bg-secondary font-heading text-lg font-semibold text-muted-foreground">
          {org.name.charAt(0)}
        </div>
      )}
      {isAdmin && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.svg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadLogo(file);
              e.target.value = "";
            }}
          />
          <Button variant="outline" size="sm" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
            {isUploading ? "Uploading…" : "Upload logo"}
          </Button>
          <p className="mt-1.5 text-xs text-muted-foreground">PNG, JPG, WEBP, or SVG.</p>
        </div>
      )}
    </div>
  );
}

function OrgDetailsForm({ org, isAdmin }: { org: Organization; isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [contactName, setContactName] = useState(org.contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(org.contact_email ?? "");
  const [address, setAddress] = useState(org.address ?? "");

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: updateOrganization.fn,
    onSuccess: (updated) => {
      queryClient.setQueryData(getOrganization.key, updated);
      toast("Organization details updated");
    },
    onError: (error) => toast((error as { message?: string })?.message ?? "Something went wrong."),
  });

  return (
    <>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 text-[12.5px] font-semibold">Name</Label>
          <Input value={org.name} disabled />
        </div>
        <div>
          <Label className="mb-1.5 text-[12.5px] font-semibold">Org code</Label>
          <Input value={org.code} disabled />
        </div>
        <div>
          <Label className="mb-1.5 text-[12.5px] font-semibold">Contact name</Label>
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} disabled={!isAdmin} />
        </div>
        <div>
          <Label className="mb-1.5 text-[12.5px] font-semibold">Contact email</Label>
          <Input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            disabled={!isAdmin}
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="mb-1.5 text-[12.5px] font-semibold">Address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} disabled={!isAdmin} />
        </div>
      </div>

      {isAdmin && (
        <div className="mt-4 flex justify-end">
          <Button
            disabled={isSaving}
            onClick={() =>
              save({
                contactName: contactName.trim(),
                contactEmail: contactEmail.trim(),
                address: address.trim(),
              })
            }
          >
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </>
  );
}

export default function SettingsPage() {
  const { isAdmin } = useSession();
  const { data: org } = useQuery({ queryKey: getOrganization.key, queryFn: getOrganization.fn });

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
          <>
            <div className="mb-5">
              <OrgLogo org={org} isAdmin={isAdmin} />
            </div>
            <OrgDetailsForm key={org.id} org={org} isAdmin={isAdmin} />
          </>
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
