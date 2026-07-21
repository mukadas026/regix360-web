import type { Organization, OrgUser, PendingInvite, Role } from "@/types/asset-platform";
import { supabase } from "@/lib/supabase-client";
import { client, throwError } from "./client";

const LOGO_BUCKET = "company-logos";

export const getOrganization = {
  key: ["organization"] as const,
  fn: async (): Promise<Organization> => {
    try {
      const res = await client.get<{ organization: Organization }>("/api/organization");
      return res.data.organization;
    } catch (error) {
      throwError(error);
    }
  },
};

export type UpdateOrganizationInput = {
  contactName?: string;
  contactEmail?: string;
  address?: string;
};

export const updateOrganization = {
  fn: async (input: UpdateOrganizationInput): Promise<Organization> => {
    try {
      const res = await client.patch<{ organization: Organization }>("/api/organization", input);
      return res.data.organization;
    } catch (error) {
      throwError(error);
    }
  },
};

// Direct-to-Storage upload, same two-step pattern as the imports wizard:
// mint a signed target, PUT the file straight to Storage, then confirm.
export const uploadOrganizationLogo = {
  fn: async (file: File): Promise<Organization> => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    let upload: { path: string; token: string; signedUrl: string };
    try {
      const res = await client.post<{ path: string; token: string; signedUrl: string }>("/api/organization/logo", { ext });
      upload = res.data;
    } catch (error) {
      throwError(error);
    }

    const { error } = await supabase.storage.from(LOGO_BUCKET).uploadToSignedUrl(upload.path, upload.token, file);
    if (error) throw { name: "ApiError", message: error.message ?? "The logo upload failed. Try again." };

    try {
      const res = await client.put<{ organization: Organization }>("/api/organization/logo", { path: upload.path });
      return res.data.organization;
    } catch (confirmError) {
      throwError(confirmError);
    }
  },
};

export type OrgUsers = {
  members: OrgUser[];
  pendingInvites: PendingInvite[];
};

export const getOrgUsers = {
  key: ["orgUsers"] as const,
  fn: async (): Promise<OrgUsers> => {
    try {
      const res = await client.get<OrgUsers>("/api/users");
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};

export type InviteUserInput = {
  email: string;
  role: Role;
};

export const inviteUser = {
  fn: async (input: InviteUserInput): Promise<{ ok: boolean; note: string }> => {
    try {
      const res = await client.post<{ ok: boolean; note: string }>("/api/users/invites", input);
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};

export type UpdateMemberInput = {
  membershipId: string;
  role?: Role;
  isActive?: boolean;
};

export type Member = {
  id: string;
  user_id: string;
  role: Role;
  is_active: boolean;
};

export const updateMember = {
  fn: async ({ membershipId, ...input }: UpdateMemberInput): Promise<Member> => {
    try {
      const res = await client.patch<{ member: Member }>(`/api/users/${membershipId}`, input);
      return res.data.member;
    } catch (error) {
      throwError(error);
    }
  },
};

export const revokeInvite = {
  fn: async (inviteId: string): Promise<{ ok: true }> => {
    try {
      const res = await client.delete<{ ok: true }>(`/api/users/invites/${inviteId}`);
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};
