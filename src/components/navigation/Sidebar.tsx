
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import type { NavSection } from "./nav-config";

// This is the persistent sidebar for desktop
export function Sidebar({ sections }: { sections: NavSection[] }) {
    return (
        <aside className="hidden md:block w-64 shrink-0 border-r bg-background">
             <SidebarContent sections={sections} />
        </aside>
    );
}

// This is the trigger + drawer for mobile
export function SidebarClient({ sections }: { sections: NavSection[] }) {
    const [open, setOpen] = React.useState(false);
    return (
        <>
            <div className="md:hidden sticky top-0 z-10 h-14 bg-background/70 backdrop-blur border-b flex items-center px-4">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button size="icon" variant="outline">
                            <PanelLeft className="h-5 w-5" />
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                         <SidebarContent sections={sections} onLinkClick={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}

// The actual navigation content, shared by both
function SidebarContent({ sections, onLinkClick }: { sections: NavSection[], onLinkClick?: () => void }) {
    const pathname = usePathname();

    return (
        <div className="h-full flex flex-col">
            <div className="h-16 flex items-center px-4 border-b">
                <Link href="/dashboard" className="font-bold text-lg text-primary">Signed!</Link>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-4">
                {sections.map((sec, idx) => (
                    <div key={idx} className="space-y-1">
                        {sec.title && (
                            <div className="px-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold mt-3">
                                {sec.title}
                            </div>
                        )}
                        <ul className="mt-1">
                            {sec.items.map((it) => {
                                const active = pathname === it.href || (it.href !== '/dashboard' && pathname.startsWith(it.href));
                                return (
                                    <li key={it.href}>
                                        <Link
                                            href={it.href}
                                            onClick={onLinkClick}
                                            className={[
                                                "block rounded-md px-3 py-2 text-sm transition-colors",
                                                active
                                                    ? "bg-primary text-primary-foreground font-medium"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                            ].join(" ")}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <span>{it.label}</span>
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>
        </div>
    );
}
