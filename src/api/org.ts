import { mockOrg, mockPendingInvites, mockUsers } from "@/lib/mock-data";
import type { PendingInvite, Role } from "@/types/asset-platform";
import { delay } from "./mock";

export const getOrg = {
  key: ["org"] as const,
  fn: async () => delay(mockOrg),
};

export const getOrgUsers = {
  key: ["orgUsers"] as const,
  fn: async () => delay(mockUsers),
};

export const getPendingInvites = {
  key: ["pendingInvites"] as const,
  fn: async () => delay(mockPendingInvites),
};

export type UpdateUserInput = {
  userId: string;
  role?: Role;
  isActive?: boolean;
};

export const updateOrgUser = {
  fn: async (input: UpdateUserInput) => {
    const user = mockUsers.find((u) => u.id === input.userId);
    if (!user) throw { name: "ApiError", message: "Member not found." };
    if (input.role) user.role = input.role;
    if (input.isActive !== undefined) user.isActive = input.isActive;
    return delay(user);
  },
};

export type InviteUserInput = {
  email: string;
  role: Role;
};

export const inviteOrgUser = {
  fn: async (input: InviteUserInput) => {
    const invite: PendingInvite = {
      id: `invite-${mockPendingInvites.length + 1}`,
      email: input.email,
      role: input.role,
      createdAt: "Just now",
    };
    mockPendingInvites.unshift(invite);
    return delay(invite);
  },
};

export const revokeInvite = {
  fn: async (inviteId: string) => {
    const idx = mockPendingInvites.findIndex((i) => i.id === inviteId);
    if (idx !== -1) mockPendingInvites.splice(idx, 1);
    return delay({ ok: true });
  },
};
