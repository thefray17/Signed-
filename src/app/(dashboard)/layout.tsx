
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth-server";
import { AppShell } from "@/components/shell/AppShell";


export const dynamic = "force-dynamic";


export default async function DashboardGroupLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUserWithRole();
  if (!user) {
    redirect("/login");
  }

  // This layout protects all routes within (dashboard), including /admin/*
  if (user.role !== 'root' && !['admin', 'coadmin'].includes(user.role) && (children as any)?.props?.childProp?.segment === 'admin') {
      redirect("/dashboard");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
