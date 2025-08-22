
import type { Role } from "./roles";

export type NavItem = { label: string; href: string; icon?: string; badge?: string; external?: boolean };
export type NavSection = { title?: string; items: NavItem[] };

export const NAV: Record<Role, NavSection[]> = {
  root: [
    { title: "Root", items: [
      { label: "Root Dashboard", href: "/root" },
      { label: "User Management", href: "/root/users" },
      { label: "System Health", href: "/root/system" },
      { label: "Audit Logs", href: "/root/logs" },
      { label: "Feature Flags", href: "/root/flags" },
      { label: "Maintenance Mode", href: "/root/maintenance" },
    ]},
    { title: "Operations", items: [
      { label: "Admin Dashboard", href: "/admin" },
      { label: "Offices", href: "/admin/offices" },
      { label: "Requests", href: "/admin/requests" },
      { label: "Messaging", href: "/admin/messaging" },
      { label: "Notifications", href: "/admin/notifications" },
      { label: "Payroll", href: "/admin/payroll" },
    ]},
    { title: "User", items: [
      { label: "User Dashboard", href: "/user" },
      { label: "Onboarding", href: "/user/onboarding" },
      { label: "Profile", href: "/user/profile" },
    ]},
  ],
  admin: [
    { title: "Admin", items: [
      { label: "Admin Dashboard", href: "/admin" },
      { label: "Offices", href: "/admin/offices" },
      { label: "Requests", href: "/admin/requests" },
      { label: "Messaging", href: "/admin/messaging" },
      { label: "Notifications", href: "/admin/notifications" },
      { label: "Payroll", href: "/admin/payroll" },
    ]},
    { title: "User", items: [
      { label: "User Dashboard", href: "/user" },
      { label: "Profile", href: "/user/profile" },
    ]},
  ],
  coadmin: [
    { title: "Team", items: [
      { label: "Requests", href: "/admin/requests" },
      { label: "Messaging", href: "/admin/messaging" },
      { label: "Offices", href: "/admin/offices" },
    ]},
    { title: "User", items: [
      { label: "User Dashboard", href: "/user" },
      { label: "Profile", href: "/user/profile" },
    ]},
  ],
  user: [
    { title: "User", items: [
      { label: "Dashboard", href: "/user" },
      { label: "Onboarding", href: "/user/onboarding" },
      { label: "Profile", href: "/user/profile" },
    ]},
  ],
  guest: [
    { title: "Public", items: [
      { label: "Home", href: "/" },
      { label: "Login", href: "/login" },
    ]},
  ],
};
