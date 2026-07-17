import { client, throwError } from "./client";

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

// Not documented in api.md yet — backend needs to add GET /api/me returning the
// signed-in user's org/platform role. There is currently no way for the frontend
// to learn this after a plain login (only POST /api/invites/accept returns it).
export type Me = {
  orgId: string | null;
  orgRole: "viewer" | "asset_manager" | "org_admin" | null;
  platformRole: "operator" | "super_admin" | null;
};

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
