
import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth-server";
import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Login | Signed!",
    description: "Login to your Signed! account.",
};

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const user = await getCurrentUserWithRole();
  if (user) {
    if (user.role === 'root') redirect('/rootadmin');
    redirect(searchParams?.next || "/dashboard");
  }
  return <LoginForm />;
}
