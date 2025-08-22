
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth-server";
import { AppShell } from "@/components/shell/AppShell";
import { isElevated } from "@/lib/roles";


export const dynamic = "force-dynamic";


export default async function AdminLayout({ children }: { children: ReactNode }) {
    const user = await getCurrentUserWithRole();

    if (!user) {
        redirect("/login");
    }

    if (!isElevated(user.role)) {
        redirect("/dashboard");
    }
    
    return <AppShell user={user}>{children}</AppShell>;
}
