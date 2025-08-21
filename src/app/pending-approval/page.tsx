"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebase-client";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Hourglass, LogOut } from "lucide-react";

export default function PendingApprovalPage() {
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-secondary rounded-full p-4 w-fit">
                        <Hourglass className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="mt-4 text-2xl font-headline">Account Pending Approval</CardTitle>
                    <CardDescription>
                        Thank you for registering. Your account is currently waiting for approval from an administrator. You will be able to log in once your role and office have been confirmed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        You can close this page for now. Please check back later. If you have any questions, please contact your system administrator.
                    </p>
                    <Button onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
