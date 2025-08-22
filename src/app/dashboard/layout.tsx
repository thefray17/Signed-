
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth-server";
import { AppShell } from "@/components/shell/AppShell";


export const dynamic = "force-dynamic"; // ensures fresh role on nav changes if session updates


export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const user = await getCurrentUserWithRole();
    if (!user) {
        redirect("/login");
    }
    return <AppShell user={user}>{children}</AppShell>;
}
