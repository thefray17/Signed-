
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { httpsCallable, getFunctions } from "firebase/functions";
import { db, app } from "@/lib/firebase-app";
import { getAuth } from "firebase/auth";
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
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [newRole, setNewRole] = useState<'user' | 'coadmin' | 'admin' | null>(null);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
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
    
  return (
    <>
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
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenRoleDialog(user)}>
                            Change Role
                          </DropdownMenuItem>
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

     <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Change Role for {selectedUser?.displayName}</DialogTitle>
                <DialogDescription>
                   Select a new role for this user. They will inherit the permissions of the new role immediately.
                </DialogDescription>
            </DialogHeader>
             {newRole && (
              <RadioGroup defaultValue={newRole} onValueChange={(value: 'user' | 'coadmin' | 'admin') => setNewRole(value)} className="space-y-2 py-4">
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
                    Save Changes
                </Button>
            </DialogFooter>
        </DialogContent>
     </Dialog>
    </>
  );
}
