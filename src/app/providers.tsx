
"use client";

import React from "react";
import { AuthProvider } from "@/components/providers/auth-provider"; 
import AuthRedirect from "@/components/providers/auth-redirect";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthRedirect />
      {children}
      <Toaster />
    </AuthProvider>
  );
}
