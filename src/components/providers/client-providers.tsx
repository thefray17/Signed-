
"use client";

import { AuthProvider } from '@/components/providers/auth-provider';
import AuthRedirect from '@/components/providers/auth-redirect';
import { Toaster } from '@/components/ui/toaster';

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AuthRedirect />
            {children}
            <Toaster />
        </AuthProvider>
    );
}
