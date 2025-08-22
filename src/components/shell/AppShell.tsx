
"use client";

import * as React from "react";
import type { AppUser } from "@/types";
import { getNavForRole } from "@/components/navigation/nav-config";
import { Sidebar, SidebarClient } from "@/components/navigation/Sidebar";
import { UserNav } from "../layout/user-nav";


export function AppShell({ user, children }: { user: AppUser; children: React.ReactNode }) {
    const sections = getNavForRole(user.role);
    return (
        <div className="min-h-screen w-full bg-muted/40">
            <div className="flex">
                {/* Desktop persistent */}
                <Sidebar sections={sections} />
                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                    {/* Mobile trigger and drawer */}
                    <SidebarClient sections={sections} />
                    <Topbar user={user} />
                    <main className="px-4 md:px-6 py-6 min-h-0 flex-1">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}


function Topbar({ user }: { user: AppUser }) {
    return (
        <header className="sticky top-0 z-10 h-14 bg-background/70 backdrop-blur border-b flex items-center px-4 md:px-6">
            <div className="ml-0 md:ml-0 font-medium">{user.role.charAt(0).toUpperCase() + user.role.slice(1)} Panel</div>
            <div className="ml-auto flex items-center gap-3">
                 <UserNav />
            </div>
        </header>
    );
}
