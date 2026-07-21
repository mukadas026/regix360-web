import { deleteCookie, getCookie } from "cookies-next";
import type { QueryClient } from "@tanstack/react-query";
import { TOKEN_COOKIE } from "@/api/client";
import { signOutRemote } from "@/api/auth";

export async function signOut(router: { push: (href: string) => void }, queryClient?: QueryClient) {
  const token = getCookie(TOKEN_COOKIE);
  await signOutRemote(typeof token === "string" ? token : undefined);
  deleteCookie(TOKEN_COOKIE);
  queryClient?.clear();
  router.push("/login");
}
