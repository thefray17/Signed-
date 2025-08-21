
"use client"

import React from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { FileSignature, ShieldAlert, LogOut } from "lucide-react";

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenuItem, SidebarMenu, SidebarMenuButton, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase-client';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/header';

function RootAdminMobileSidebar({ onSignOut }: { onSignOut: () => void }) {
    const { openMobile, setOpenMobile } = useSidebar();
    return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
            <SheetContent side="left" className="p-0 w-[18rem]">
                <SheetHeader className="sr-only">
                    <SheetTitle>Root Admin Menu</SheetTitle>
                    <SheetDescription>Navigation links for the root admin dashboard.</SheetDescription>
                </SheetHeader>
                 <SidebarHeader>
                    <div className="flex items-center gap-2 p-2">
                        <ShieldAlert className="h-6 w-6 text-destructive"/>
                        <span className="text-lg font-semibold">Root Admin</span>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    {/* Add any mobile nav items here if needed */}
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

export default function RootAdminLayout({
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
            <div className="flex h-screen w-full p-6">
                <Skeleton className="h-full w-full" />
            </div>
        )
    }

    return (
        <SidebarProvider>
            <RootAdminMobileSidebar onSignOut={handleSignOut} />
            <Sidebar className="hidden md:flex">
                <SidebarHeader>
                    <div className="flex items-center gap-2 p-2">
                        <ShieldAlert className="h-6 w-6 text-destructive"/>
                        <span className="text-lg font-semibold">Root Admin</span>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                     <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Root Dashboard" isActive>
                                <Link href="/rootadmin">
                                    <ShieldAlert/>
                                    <span>User Management</span>
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
                     <main className="flex-1 p-4 sm:px-6 sm:py-6 md:gap-8">
                        {children}
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
