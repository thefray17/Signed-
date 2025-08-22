
import type { Metadata } from 'next';
import { ClientProviders } from '@/components/providers/client-providers';
import './globals.css';
import { auth } from "@/lib/server-auth";
import { getRoleFromClaims } from "@/lib/roles";
import { NAV } from "@/lib/nav";
import { AppSidebar } from "@/components/app-sidebar";
import React from "react";
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Signed!',
  description: 'Document Signing and Tracking System',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth().catch(() => null);
  const claims: any = (session?.user as any)?.claims ?? {};
  const role = getRoleFromClaims(claims);

  const showSidebar = role !== "guest";
  const sections = role === "root" ? NAV.root : NAV[role];

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ClientProviders>
          {showSidebar ? (
            <div className="min-h-dvh w-full flex">
              <aside className="hidden md:block">
                <AppSidebar sections={sections} projectLabel="Signed! (α)" />
              </aside>
              <div className="flex-1 flex min-w-0 flex-col">
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
                  <div className="font-medium"></div>
                  <div className="text-sm text-muted-foreground ml-auto">
                    {role === "root" ? "Root" : role.charAt(0).toUpperCase() + role.slice(1)}
                  </div>
                </header>
                <main className="flex-1 min-w-0 p-4 md:p-6">{children}</main>
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
