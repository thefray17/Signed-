"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase-app";
import type { AppUser } from "@/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react"
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const usersCollection = collection(db, "users");
                const userSnapshot = await getDocs(usersCollection);
                const usersList = userSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as AppUser));
                setUsers(usersList);
            } catch (error) {
                console.error("Error fetching users: ", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load users.",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Users</CardTitle>
        <CardDescription>
          View and manage all user accounts in the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="hidden md:table-cell">Office</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {loading ? (
                <TableRow>
                    <TableCell colSpan={5}>
                        <Skeleton className="h-10 w-full" />
                    </TableCell>
                </TableRow>
             ) : (
                users.map(user => (
                  <TableRow key={user.uid}>
                    <TableCell>
                      <div className="font-medium">{user.displayName}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.office}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant={user.role === 'admin' ? "default" : "secondary"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant={user.status === 'approved' ? 'default' : user.status === 'rejected' ? 'destructive' : 'secondary'}>{user.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-label="Open user actions menu" aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Change Role</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Disable User</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
