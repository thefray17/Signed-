
"use client"

import React from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { FileSignature, Home, FileText, Bell, LogOut, Building, ShieldAlert } from "lucide-react";

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { auth } from '@/lib/firebase-client';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/header';

function DashboardMobileSidebar({ user, onSignOut }: { user: any, onSignOut: () => void }) {
    const { openMobile, setOpenMobile } = useSidebar();
    return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
            <SheetContent side="left" className="p-0 w-[18rem]">
                 <SheetHeader className="p-4 border-b">
                    <SheetTitle className="sr-only">Main Menu</SheetTitle>
                    <SheetDescription className="sr-only">Navigation links for the user dashboard.</SheetDescription>
                    <div className="flex items-center gap-2">
                        <FileSignature className="h-6 w-6 text-primary"/>
                        <span className="text-lg font-semibold">Signed!</span>
                    </div>
                </SheetHeader>
                <SidebarContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Dashboard">
                                <Link href="/dashboard">
                                    <Home/>
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="My Documents">
                                <Link href="/dashboard/documents">
                                    <FileText/>
                                    <span>My Documents</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        {(user.role === 'admin' || user.role === 'coadmin') && (
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Admin Dashboard">
                                    <Link href="/admin">
                                        <Building />
                                        <span>Admin Dashboard</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>)}
                        {user.isRoot && (
                             <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Root Admin">
                                    <Link href="/rootadmin">
                                        <ShieldAlert />
                                        <span>Root Admin</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                        <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Notifications">
                            <Link href="/dashboard/notifications">
                                <Bell/>
                                <span>Notifications</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                    <Button variant="ghost" className="w-full justify-start gap-2" onClick={onSignOut}>
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                    </Button>
                </SidebarFooter>
            </SheetContent>
        </Sheet>
    )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

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
             <DashboardMobileSidebar user={user} onSignOut={handleSignOut} />
             <Sidebar className="hidden md:flex">
                <SidebarHeader>
                    <div className="flex items-center gap-2 p-2">
                        <FileSignature className="h-6 w-6 text-primary"/>
                        <span className="text-lg font-semibold">Signed!</span>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Dashboard">
                                <Link href="/dashboard">
                                    <Home/>
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="My Documents">
                                <Link href="/dashboard/documents">
                                    <FileText/>
                                    <span>My Documents</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        {(user.role === 'admin' || user.role === 'coadmin') && (
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Admin Dashboard">
                                    <Link href="/admin">
                                        <Building />
                                        <span>Admin Dashboard</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>)}
                        {user.isRoot && (
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Root Admin">
                                    <Link href="/rootadmin">
                                        <ShieldAlert />
                                        <span>Root Admin</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                        <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Notifications">
                            <Link href="/dashboard/notifications">
                                <Bell/>
                                <span>Notifications</span>
                            </Link>
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
