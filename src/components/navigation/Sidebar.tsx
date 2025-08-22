
import * as React from "react";
import Link from "next/link";
import { Menu, FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavSection } from "./nav-config";
import { ActiveLink } from "./ActiveLink";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Sidebar({ sections }: { sections: NavSection[] }) {
  return (
    <aside className="hidden border-r bg-muted/40 md:block w-64">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <FileSignature className="h-6 w-6" />
            <span className="">Signed!</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-4">
            {sections.map((section) => (
              <div key={section.heading} className="space-y-1">
                <h3 className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                  {section.heading}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}><ActiveLink item={item} /></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}

export function SidebarClient({ sections }: { sections: NavSection[] }) {
  "use client";
  const [open, setOpen] = React.useState(false);
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
         <nav className="grid gap-2 text-lg font-medium">
           <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold mb-4"
          >
            <FileSignature className="h-6 w-6" />
            <span className="sr-only">Signed!</span>
          </Link>
           {sections.map((section) => (
              <div key={section.heading} className="space-y-1">
                <h3 className="px-3 text-sm font-semibold uppercase text-muted-foreground">
                  {section.heading}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}><ActiveLink item={item} onClick={() => setOpen(false)} /></li>
                  ))}
                </ul>
              </div>
            ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
