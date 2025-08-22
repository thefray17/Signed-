
import "./globals.css";
import React from "react";
import { ClientProviders } from "@/components/providers/client-providers";
import { auth } from "@/lib/server-auth";
import { getRoleFromClaims } from "@/lib/roles";
import { NAV } from "@/lib/nav";
import { AppSidebar } from "@/components/app-sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { UserNav } from "@/components/layout/user-nav";


export const metadata = { title: "Signed!" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth().catch(() => null);
  const claims: any = (session?.user as any)?.claims ?? {};
  const role = getRoleFromClaims(claims);

  const showSidebar = role !== "guest";
  const sections = NAV[role];

  return (
    <html lang="en">
      <body className="min-h-dvh w-full antialiased">
        <ClientProviders>
          {showSidebar ? (
            <div className="min-h-dvh w-full flex">
              <div className="hidden md:block">
                 <AppSidebar sections={sections} projectLabel="Signed!" />
              </div>

              <div className="flex-1 flex min-w-0 flex-col">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm-bg-transparent sm:px-6">
                   <Sheet>
                    <SheetTrigger asChild>
                      <Button size="icon" variant="outline" className="sm:hidden">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="sm:max-w-xs">
                       <AppSidebar sections={sections} projectLabel="Signed! (Mobile)" />
                    </SheetContent>
                  </Sheet>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs md:text-sm text-muted-foreground">
                        {role === "root" ? "Root" : role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                    <UserNav />
                  </div>
                </header>
                <main className="flex-1 min-w-0 p-3 md:p-6">{children}</main>
              </div>
            </div>
          ) : (
            <main className="min-h-dvh">{children}</main>
          )}
        </ClientProviders>
      </body>
    </html>
  );
}
