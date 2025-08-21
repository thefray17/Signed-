"use client"

import React from 'react';
import { useRouter } from "next/navigation";
import { FileSignature, Home, UserCheck, Building, Users, LogOut } from "lucide-react";

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/header';
import { SidebarNav, type NavItem } from '@/components/layout/sidebar-nav';

const navItems: NavItem[] = [
    { href: "/admin/approvals", label: "Approvals", icon: UserCheck, roles: ['admin', 'co-admin'] },
    { href: "/admin/users", label: "Manage Users", icon: Users, roles: ['admin', 'co-admin'] },
    { href: "/admin/offices", label: "Manage Offices", icon: Building, roles: ['admin', 'co-admin'] },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    React.useEffect(() => {
        if (!loading && (!user || (user.role !== 'admin' && user.role !== 'co-admin'))) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    const handleSignOut = async () => {
        try {
          await signOut(auth);
          router.push("/login");
          toast({
            title: "Signed Out",
            description: "You have been successfully signed out.",
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error signing out",
            description: "There was a problem signing you out. Please try again.",
          })
        }
    };
    
    if (loading || !user) {
        return (
            <div className="flex h-screen w-full">
                <div className="hidden md:block w-64 border-r p-4 space-y-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex-1 p-6">
                    <Skeleton className="h-14 w-full mb-4" />
                    <Skeleton className="h-[500px] w-full" />
                </div>
            </div>
        )
    }

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
                <Sidebar>
                    <SidebarHeader>
                        <div className="flex items-center gap-2 p-2">
                            <FileSignature className="h-6 w-6 text-primary"/>
                            <span className="text-lg font-semibold">Signed! Admin</span>
                        </div>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarNav navItems={navItems} userRole={user.role} />
                    </SidebarContent>
                     <SidebarFooter>
                        <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </Button>
                    </SidebarFooter>
                </Sidebar>
                <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                    <Header title="Admin Dashboard"/>
                     <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
