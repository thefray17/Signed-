
import { auth } from "@/lib/server-auth";
import { getRoleFromClaims } from "@/lib/roles";
import { NAV } from "@/lib/nav";
import { AppSidebar } from "@/components/app-sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const claims = (session?.user as any)?.claims ?? {};
  const role = getRoleFromClaims(claims);

  // Root requirement: Root sees ROOT sidebar ALWAYS, even in /admin or /user
  const sections = role === "root" ? NAV.root : NAV[role];

  return (
    <div className="min-h-dvh w-full flex">
      {/* Sidebar (sticky) */}
      <aside className="hidden md:block">
        <AppSidebar sections={sections} projectLabel="Signed! (α)" />
      </aside>

      {/* Content */}
      <div className="flex-1 flex min-w-0 flex-col">
        {/* Top bar */}
        <header className="h-16 border-b flex items-center px-4 justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <AppSidebar sections={sections} projectLabel="Signed! (α)" />
              </SheetContent>
            </Sheet>
          </div>
          <div className="font-medium">{/* page title slot (optional) */}</div>
          <div className="text-sm text-muted-foreground ml-auto">
            {role === "root" ? "Root" : role.charAt(0).toUpperCase() + role.slice(1)}
          </div>
        </header>

        <main className="flex-1 min-w-0 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
