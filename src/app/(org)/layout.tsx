import { OrgNav, MobileTopBar } from "@/components/global/org-nav";
import { TopBar } from "@/components/global/top-bar";
import { SessionProvider } from "@/providers/session-provider";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col">
        <MobileTopBar />
        <div className="relative flex min-h-0 flex-1">
          <OrgNav />
          <main className="flex min-w-0 flex-1 flex-col bg-background">
            <TopBar />
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
