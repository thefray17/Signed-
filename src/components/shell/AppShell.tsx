
"use client";

import * as React from "react";
import type { AppUser } from "@/types";
import { getNavForRole } from "@/components/navigation/nav-config";
import { Sidebar, SidebarClient } from "@/components/navigation/Sidebar";
import { UserNav } from "../layout/user-nav";
import { usePathname } from "next/navigation";

export function AppShell({ user, children }: { user: AppUser; children: React.ReactNode }) {
    const sections = getNavForRole(user.role);
    const pathname = usePathname();
    const allItems = sections.flatMap(s => s.items);
    const currentPage = allItems.find(item => item.href === pathname || (item.href !== '/dashboard' && pathname.startsWith(item.href)));
    const pageTitle = currentPage?.label || user.role.charAt(0).toUpperCase() + user.role.slice(1) + " Panel";

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <Sidebar sections={sections} />
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <SidebarClient sections={sections} />
                    <div className="w-full flex-1">
                        <h1 className="text-lg font-semibold">{pageTitle}</h1>
                    </div>
                    <UserNav />
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
