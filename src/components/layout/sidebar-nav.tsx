"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: ('user' | 'co-admin' | 'admin')[];
}

interface SidebarNavProps {
  navItems: NavItem[];
  userRole: 'user' | 'co-admin' | 'admin';
}

export function SidebarNav({ navItems, userRole }: SidebarNavProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <SidebarMenu>
      {filteredNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
