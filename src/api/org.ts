import { mockOrg } from "@/lib/mock-data";
import type { OrgUser, PendingInvite, Role } from "@/types/asset-platform";
import { client, throwError } from "./client";

// No org-profile endpoint exists in api.md — this stays mock-backed intentionally.
export const getOrg = {
  key: ["org"] as const,
  fn: async () => mockOrg,
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
