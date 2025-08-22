
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import type { NavSection } from "@/lib/nav";

export function AppSidebar({ sections, projectLabel }: { sections: NavSection[]; projectLabel?: string; }) {
  const pathname = usePathname();

  return (
    <aside className="h-[100dvh] w-64 shrink-0 border-r bg-background">
      <div className="h-16 px-3 flex items-center border-b">
        <div className="font-semibold truncate">{projectLabel ?? "Signed!"}</div>
        <div className="ml-auto text-[10px] uppercase rounded bg-emerald-600 text-white px-2 py-0.5">
          Sidebar
        </div>
      </div>

      <nav className="overflow-y-auto p-2 space-y-4">
        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            {sec.title && (
              <div className="px-3 text-xs uppercase tracking-wide text-muted-foreground mt-3">
                {sec.title}
              </div>
            )}
            <ul className="mt-1">
              {sec.items.map((it) => {
                const active = pathname === it.href || (it.href !== '/' && pathname.startsWith(it.href));
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={[
                        "block rounded-md px-3 py-2 text-sm",
                        active ? "bg-muted font-medium" : "hover:bg-muted/60",
                      ].join(" ")}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span>{it.label}</span>
                        {it.badge && (
                          <span className="ml-auto text-2xs rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                            {it.badge}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
