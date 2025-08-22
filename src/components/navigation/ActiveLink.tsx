
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-config";

export function ActiveLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
  
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        active && "bg-muted text-primary"
      )}
    >
      {item.icon ? <item.icon className="h-4 w-4" /> : null}
      <span>{item.label}</span>
      {item.badge ? (
        <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}
