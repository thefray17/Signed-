
import type { AppUser } from "@/types";

export type NavItem = { label: string; href: string };
export type NavSection = { title?: string; items: NavItem[] };

const adminNav: NavSection[] = [
    {
        title: "Management",
        items: [
            { label: "Approvals", href: "/admin/approvals" },
            { label: "Users", href: "/admin/users" },
            { label: "Offices", href: "/admin/offices" },
            { label: "Audit Logs", href: "/admin/audit-logs" },
        ],
    },
];

const userNav: NavSection[] = [
    {
        title: "My Workspace",
        items: [
            { label: "Dashboard", href: "/dashboard" },
            { label: "My Documents", href: "/dashboard/documents" },
            { label: "Notifications", href: "/dashboard/notifications" },
        ],
    },
];


const rootNav: NavSection[] = [
     {
        title: "Root Admin",
        items: [
             { label: "Root Dashboard", href: "/rootadmin" },
        ]
     },
     ...adminNav,
     ...userNav,
]


export const NAV_CONFIG: Record<AppUser['role'], NavSection[]> = {
  root: rootNav,
  admin: [...adminNav, ...userNav],
  coadmin: [...adminNav, ...userNav],
  user: userNav,
};

export function getNavForRole(role: AppUser['role']): NavSection[] {
    return NAV_CONFIG[role] || [];
}
