import type { Role } from "./roles";

export type NavItem = { label: string; href: string; icon?: string; badge?: string; external?: boolean };
export type NavSection = { title?: string; items: NavItem[] };

export const NAV: Record<Role, NavSection[]> = {
  root: [
    { title: "Root", items: [
      { label: "Root Dashboard", href: "/rootadmin" },
    ]},
    { title: "Operations", items: [
      { label: "Admin Dashboard", href: "/admin" },
      { label: "User Approvals", href: "/admin/approvals" },
      { label: "Manage Users", href: "/admin/users" },
      { label: "Manage Offices", href: "/admin/offices" },
      { label: "Audit Logs", href: "/admin/audit-logs" },
    ]},
    { title: "User", items: [
      { label: "User Dashboard", href: "/dashboard" },
      { label: "My Documents", href: "/dashboard/documents" },
      { label: "Notifications", href: "/dashboard/notifications" },
    ]},
  ],
  admin: [
    { title: "Operations", items: [
      { label: "Admin Dashboard", href: "/admin" },
      { label: "User Approvals", href: "/admin/approvals" },
      { label: "Manage Users", href: "/admin/users" },
      { label: "Manage Offices", href: "/admin/offices" },
      { label: "Audit Logs", href: "/admin/audit-logs" },
    ]},
    { title: "User", items: [
      { label: "User Dashboard", href: "/dashboard" },
      { label: "My Documents", href: "/dashboard/documents" },
      { label: "Notifications", href: "/dashboard/notifications" },
    ]},
  ],
  coadmin: [
     { title: "Operations", items: [
      { label: "Admin Dashboard", href: "/admin" },
      { label: "User Approvals", href: "/admin/approvals" },
      { label: "Manage Users", href: "/admin/users" },
      { label: "Manage Offices", href: "/admin/offices" },
      { label: "Audit Logs", href: "/admin/audit-logs" },
    ]},
    { title: "User", items: [
      { label: "User Dashboard", href: "/dashboard" },
      { label: "My Documents", href: "/dashboard/documents" },
      { label: "Notifications", href: "/dashboard/notifications" },
    ]},
  ],
  user: [
    { title: "User", items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "My Documents", href: "/dashboard/documents" },
      { label: "Notifications", href: "/dashboard/notifications" },
    ]},
  ],
  guest: [
    { title: "Public", items: [
      { label: "Home", href: "/" },
      { label: "Login", href: "/login" },
    ]},
  ],
};
