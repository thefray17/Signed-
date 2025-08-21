import { SignupForm } from "@/components/auth/signup-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up | Signed!",
    description: "Create an account to start using Signed!.",
};

export default function SignupPage() {
    return <SignupForm />;
}
