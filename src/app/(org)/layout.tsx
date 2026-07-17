import { OrgNav, MobileTopBar } from "@/components/global/org-nav";
import { SessionProvider } from "@/providers/session-provider";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col">
        <MobileTopBar />
        <div className="relative flex min-h-0 flex-1">
          <OrgNav />
          <main className="min-w-0 flex-1 overflow-y-auto bg-background">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
