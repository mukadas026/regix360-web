import { deleteCookie } from "cookies-next";
import { TOKEN_COOKIE } from "@/api/client";

export function signOut(router: { push: (href: string) => void }) {
  deleteCookie(TOKEN_COOKIE);
  router.push("/login");
}
