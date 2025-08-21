"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { useSidebar } from "@/components/ui/sidebar";

interface HeaderProps {
    title: string;
}

export function Header({ title }: HeaderProps) {
    const { isMobile } = useSidebar();

    return (
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            {isMobile && <SidebarTrigger />}
            <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
            <div className="ml-auto">
                <UserNav />
            </div>
        </header>
    );
}
