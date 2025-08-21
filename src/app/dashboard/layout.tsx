"use client"

import React from 'react';
import { useRouter } from "next/navigation";
import { FileSignature, Home, FileText, Bell, LogOut, FileClock } from "lucide-react";

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    React.useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
                return;
            }

            if (user.role === 'admin' || user.role === 'co-admin') {
                router.push('/admin');
                return;
            }

            if (!user.onboardingComplete) {
                router.push('/onboarding');
            } else if (user.status === 'pending_approval') {
                router.push('/pending-approval');
            } else if (user.status === 'rejected') {
                signOut(auth);
                toast({
                    variant: 'destructive',
                    title: 'Access Denied',
                    description: 'Your account registration was rejected.'
                });
                router.push('/login');
            }
        }
    }, [user, loading, router, toast]);

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

    if (loading || !user || user.role === 'admin' || user.role === 'co-admin') {
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
             <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2 p-2">
                        <FileSignature className="h-6 w-6 text-primary"/>
                        <span className="text-lg font-semibold">Signed!</span>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/dashboard" tooltip="Dashboard">
                                <Home/>
                                <span>Dashboard</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/dashboard/documents" tooltip="My Documents">
                                <FileText/>
                                <span>My Documents</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                            <SidebarMenuItem>
                            <SidebarMenuButton href="/dashboard/notifications" tooltip="Notifications">
                                <Bell/>
                                <span>Notifications</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                    <SidebarFooter>
                    <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                    </Button>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <div className="flex flex-col min-h-screen w-full bg-muted/40">
                    <div className="flex flex-col sm:py-4 sm:pl-4">
                        <Header title="Dashboard"/>
                        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                            {children}
                        </main>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
