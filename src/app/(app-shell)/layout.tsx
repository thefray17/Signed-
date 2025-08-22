import { auth } from "@/lib/server-auth";
import { getRoleFromClaims } from "@/lib/roles";
import { NAV } from "@/lib/nav";
import { AppSidebar } from "@/components/app-sidebar";

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const claims = (session?.user as any)?.claims ?? {};
  const role = getRoleFromClaims(claims);

  // Root requirement: Root sees ROOT sidebar ALWAYS, even in /admin or /user
  const sections = role === "root" ? NAV.root : NAV[role];

  return (
    <div className="min-h-dvh w-full flex">
      {/* Sidebar (sticky) */}
      <div className="hidden md:block">
        <AppSidebar sections={sections} projectLabel="Signed! (α)" />
      </div>

      {/* Content */}
      <div className="flex-1 flex min-w-0 flex-col">
        {/* Top bar (optional) */}
        <div className="h-16 border-b flex items-center px-4 justify-between">
          <div className="md:hidden">
            {/* TODO: add mobile sheet to open sidebar */}
            <span className="text-sm text-muted-foreground">Menu</span>
          </div>
          <div className="font-medium">{/* page title slot (optional) */}</div>
          <div className="text-sm text-muted-foreground">
            {role === "root" ? "Root" : role.charAt(0).toUpperCase() + role.slice(1)}
          </div>
        </div>

        <main className="flex-1 min-w-0 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
