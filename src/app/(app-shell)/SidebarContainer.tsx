
"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { NAV } from "@/lib/nav";
import { getRoleFromClaims } from "@/lib/roles";
import { useAuth } from "@/hooks/use-auth";

export function SidebarContainer() {
  const { user, claims, loading } = useAuth?.() ?? { user: null, claims: null, loading: false };

  // while auth is initializing on client, show a placeholder so layout doesn't jump
  if (loading) {
    return (
      <aside className="h-[100dvh] w-64 shrink-0 border-r bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
        Loading…
      </aside>
    );
  }

  // Compute role from client claims (most reliable)
  const role = getRoleFromClaims(claims || {});
  const sections = NAV[role];

  // SAFETY: even if role is "guest", let's still show a minimal sidebar so we can see it.
  const fallbackSections = [{ items: [{ label: "Home", href: "/" }, { label: "Login", href: "/login" }] }];
  const visibleSections = sections && sections.length ? sections : (fallbackSections as any);

  return <AppSidebar sections={visibleSections} projectLabel="Signed! (α)" />;
}
