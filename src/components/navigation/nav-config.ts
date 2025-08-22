
import type { UserRole } from "@/types";
import type { ComponentType, SVGProps } from "react";
import {
  Home, Users, Files, Settings, FileText, Inbox, Send, BarChart2, Building2, History, Bell, CheckSquare
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: string;
};
export type NavSection = { heading: string; items: NavItem[] };

const rootNav: NavSection[] = [
  { heading: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: Home }] },
  { heading: "Administration", items: [
      { label: "Approvals", href: "/admin/approvals", icon: CheckSquare },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Offices", href: "/admin/offices", icon: Building2 },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: History },
    ]},
   { heading: "My Workspace", items: [
      { label: "My Documents", href: "/dashboard/documents", icon: Files },
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ]},
];

const adminNav: NavSection[] = [
  { heading: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: Home }] },
  { heading: "Administration", items: [
      { label: "Approvals", href: "/admin/approvals", icon: CheckSquare },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Offices", href: "/admin/offices", icon: Building2 },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: History },
    ]},
   { heading: "My Workspace", items: [
      { label: "My Documents", href: "/dashboard/documents", icon: Files },
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ]},
];

const coAdminNav: NavSection[] = [
  { heading: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: Home }] },
  { heading: "Administration", items: [
      { label: "Approvals", href: "/admin/approvals", icon: CheckSquare },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Offices", href: "/admin/offices", icon: Building2 },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: History },
    ]},
   { heading: "My Workspace", items: [
      { label: "My Documents", href: "/dashboard/documents", icon: Files },
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ]},
];

const userNav: NavSection[] = [
  { heading: "My Workspace", items: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "My Documents", href: "/dashboard/documents", icon: Files },
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ]},
];

export function getNavForRole(role: UserRole): NavSection[] {
  switch (role) {
    case "root": return rootNav;
    case "admin": return adminNav;
    case "coadmin": return coAdminNav;
    default: return userNav;
  }
}
