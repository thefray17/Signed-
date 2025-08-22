
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth-server";
import { AppShell } from "@/components/shell/AppShell";


export const dynamic = "force-dynamic";


export default async function RootAdminLayout({ children }: { children: ReactNode }) {
    const user = await getCurrentUserWithRole();

    if (!user) {
        redirect("/login");
    }

    if (user.role !== 'root') {
        redirect("/dashboard");
    }
    
    return <AppShell user={user}>{children}</AppShell>;
}
