import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | Signed!",
    description: "Login to your Signed! account.",
};

export default function LoginPage() {
    return <LoginForm />;
}
