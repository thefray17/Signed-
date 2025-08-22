
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { httpsCallable, getFunctions } from "firebase/functions";
import { db, app } from "@/lib/firebase-app";
import type { AppUser, UserRole, UserStatus } from "@/types";
import Papa from "papaparse";

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
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // State for role management
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [newRole, setNewRole] = useState<UserRole | null>(null);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    
    // State for status management
    const [newStatus, setNewStatus] = useState<UserStatus | null>(null);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
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
                description: "Could not load users.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        return users.filter(user =>
            user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);


    // Role change logic
    const handleOpenRoleDialog = (user: AppUser) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setIsRoleDialogOpen(true);
    }

    const handleRoleChangeSubmit = async () => {
        if (!selectedUser || !newRole) return;
        setIsSubmitting(true);
        try {
            const functions = getFunctions(app, "asia-southeast1");
            const assignUserRole = httpsCallable(functions, "assignUserRole");
            await assignUserRole({ targetUserId: selectedUser.uid, role: newRole });
            
            // Optimistic update
            setUsers(prevUsers => prevUsers.map(u => u.uid === selectedUser.uid ? {...u, role: newRole} : u));

            toast({
                title: "Role Updated",
                description: `${selectedUser.displayName}'s role has been changed to ${newRole}.`,
            });
            setIsRoleDialogOpen(false);
        } catch (error: any) {
            console.error("Error updating role:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "There was a problem changing the user role.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Status change logic
    const handleOpenStatusDialog = (user: AppUser) => {
        setSelectedUser(user);
        setNewStatus(user.status);
        setIsStatusDialogOpen(true);
    };

    const handleStatusChangeSubmit = async () => {
        if (!selectedUser || !newStatus) return;
        setIsSubmitting(true);
        try {
            const functions = getFunctions(app, "asia-southeast1");
            const updateUserStatus = httpsCallable(functions, "updateUserStatus");
            await updateUserStatus({ targetUserId: selectedUser.uid, status: newStatus });
            
            // Optimistic update
            setUsers(prevUsers => prevUsers.map(u => u.uid === selectedUser.uid ? {...u, status: newStatus} : u));

            toast({
                title: "Status Updated",
                description: `${selectedUser.displayName}'s status has been changed to ${newStatus}.`,
            });
            setIsStatusDialogOpen(false);
        } catch (error: any) {
            console.error("Error updating status:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "There was a problem changing the user status.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>
                  View, manage, and invite all user accounts in the system.
                </CardDescription>
            </div>
            <div className="w-full max-w-sm">
                <Input 
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
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
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={5}>
                            <Skeleton className="h-10 w-full" />
                        </TableCell>
                    </TableRow>
                ))
             ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <TableRow key={user.uid}>
                    <TableCell>
                      <div className="font-medium">{user.displayName}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.officeName}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant={user.role === 'admin' ? "default" : "secondary"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant={user.status === 'approved' ? 'default' : user.status === 'rejected' ? 'destructive' : 'secondary'}>{user.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-label="Open user actions menu" aria-haspopup="true" size="icon" variant="ghost" disabled={user.uid === currentUser?.uid}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenRoleDialog(user)}>
                            Change Role
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleOpenStatusDialog(user)}>
                            Change Status
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Disable User</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
             ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        {searchTerm ? "No users match your search." : "No users found in the system."}
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

     <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Change Role for {selectedUser?.displayName}</DialogTitle>
                <DialogDescription>
                   Select a new role for this user. They will inherit the permissions of the new role immediately.
                </DialogDescription>
            </DialogHeader>
             {newRole && (
              <RadioGroup value={newRole} onValueChange={(value: UserRole) => setNewRole(value)} className="space-y-2 py-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="user" id="r-user" />
                    <Label htmlFor="r-user">User</Label>
                  </div>
                   <div className="flex items-center space-x-2">
                    <RadioGroupItem value="coadmin" id="r-coadmin" />
                    <Label htmlFor="r-coadmin">Co-Admin</Label>
                  </div>
              </RadioGroup>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleRoleChangeSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Role
                </Button>
            </DialogFooter>
        </DialogContent>
     </Dialog>

     <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Change Status for {selectedUser?.displayName}</DialogTitle>
                <DialogDescription>
                   Update the user's account status. 'Rejected' will prevent them from logging in again.
                </DialogDescription>
            </DialogHeader>
             {newStatus && (
              <RadioGroup value={newStatus} onValueChange={(value: UserStatus) => setNewStatus(value)} className="space-y-2 py-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pending" id="s-pending" />
                    <Label htmlFor="s-pending">Pending</Label>
                  </div>
                   <div className="flex items-center space-x-2">
                    <RadioGroupItem value="approved" id="s-approved" />
                    <Label htmlFor="s-approved">Approved</Label>
                  </div>
                   <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rejected" id="s-rejected" />
                    <Label htmlFor="s-rejected">Rejected</Label>
                  </div>
              </RadioGroup>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleStatusChangeSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Status
                </Button>
            </DialogFooter>
        </DialogContent>
     </Dialog>
    </>
  );
}

    