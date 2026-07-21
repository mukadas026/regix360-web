import { client, throwError } from "./client";
import type { Me } from "@/types/asset-platform";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export type SignInInput = {
  email: string;
  password: string;
};

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export const signIn = {
  fn: async (input: SignInInput): Promise<SupabaseSession> => {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_PUBLISHABLE_KEY ?? "" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) {
      throw { name: "ApiError", message: data?.error_description ?? data?.msg ?? "Invalid email or password." };
    }
    return data;
  },
};

// Revokes the session's refresh token server-side (Supabase Auth's own
// logout endpoint — this backend has no /api/logout of its own).
// Best-effort: sign-out proceeds locally even if this call fails.
export async function signOutRemote(accessToken: string | undefined) {
  if (!accessToken) return;
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout?scope=local`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_PUBLISHABLE_KEY ?? "" },
    });
  } catch {
    // ignore — local cookie/cache clearing below still happens
  }
}

export const getMe = {
  key: ["me"] as const,
  fn: async (): Promise<Me> => {
    try {
      const res = await client.get<Me>("/api/me");
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};

export type AcceptInviteInput = {
  password: string;
  fullName?: string;
};

export const acceptInvite = {
  fn: async (input: AcceptInviteInput) => {
    try {
      const res = await client.post<{ ok: boolean; orgId: string | null; orgRole: string | null; platformRole: string | null }>(
        "/api/invites/accept",
        input,
      );
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};
