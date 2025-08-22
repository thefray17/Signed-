
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function ApprovalsPage() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

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
                description: "Could not load users for approval.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUserAction = async (userId: string, newStatus: 'approved' | 'rejected') => {
        try {
            const userDocRef = doc(db, 'users', userId);
            await updateDoc(userDocRef, { status: newStatus, updatedAt: new Date() });
            toast({
                title: `User ${newStatus}`,
                description: `The user has been successfully ${newStatus}.`,
            });
            fetchUsers(); // Refresh the list
        } catch (error) {
            console.error(`Error ${newStatus} user:`, error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'There was a problem updating the user status.',
            });
        }
    };

    const renderUserTable = (userList: AppUser[], status: string) => (
         <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Requested Office</TableHead>
                <TableHead className="hidden md:table-cell">Requested Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={4}>
                                <Skeleton className="h-10 w-full" />
                            </TableCell>
                        </TableRow>
                    ))
                ) : userList.length > 0 ? userList.map(user => (
                <TableRow key={user.uid}>
                    <TableCell>
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.officeName}</TableCell>
                    <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{user.desiredRole}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="sm" onClick={() => handleUserAction(user.uid, 'rejected')}>Reject</Button>
                                <Button size="sm" onClick={() => handleUserAction(user.uid, 'approved')}>Approve</Button>
                            </div>
                        )}
                         {status !== 'pending' && (
                            <Badge variant={status === 'approved' ? 'default' : 'destructive'}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Badge>
                        )}
                    </TableCell>
                </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">
                           There are no {status} users at this time.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => u.status === 'approved');
  const rejectedUsers = users.filter(u => u.status === 'rejected');

  return (
    <Tabs defaultValue="pending">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingUsers.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedUsers.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedUsers.length})</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="pending">
        <Card>
          <CardHeader>
            <CardTitle>Pending User Approvals</CardTitle>
            <CardDescription>
              Review and approve or reject new user registrations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderUserTable(pendingUsers, 'pending')}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="approved">
        <Card>
            <CardHeader>
                <CardTitle>Approved Users</CardTitle>
                <CardDescription>Users who have been granted access.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderUserTable(approvedUsers, 'approved')}
            </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="rejected">
        <Card>
            <CardHeader>
                <CardTitle>Rejected Users</CardTitle>
                <CardDescription>Users who have been denied access.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderUserTable(rejectedUsers, 'rejected')}
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
