
"use client";

import { useState, useEffect, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { httpsCallable, getFunctions } from "firebase/functions";
import { db, app } from "@/lib/firebase-app";
import { getAuth } from "firebase/auth";
import type { AppUser } from "@/types";
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
import { MoreHorizontal, Loader2, Upload, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [newRole, setNewRole] = useState<'user' | 'coadmin' | 'admin' | null>(null);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            if (file.type !== "text/csv") {
                toast({
                    variant: "destructive",
                    title: "Invalid File Type",
                    description: "Please upload a valid CSV file.",
                });
                return;
            }
            setCsvFile(file);
        }
    };
    
    const handleBulkInvite = () => {
        if (!csvFile) {
            toast({
                variant: "destructive",
                title: "No File Selected",
                description: "Please select a CSV file to upload.",
            });
            return;
        }

        // Placeholder for future implementation
        console.log("Parsing and sending invites for:", csvFile.name);
        Papa.parse(csvFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                console.log("Parsed CSV data:", results.data);
                // Here you would call a cloud function with results.data
                toast({
                    title: "Processing Invites",
                    description: "Your bulk invitation is being processed.",
                });
                setIsInviteDialogOpen(false);
                setCsvFile(null);
            },
            error: (error: any) => {
                 toast({
                    variant: "destructive",
                    title: "CSV Parsing Error",
                    description: error.message,
                });
            }
        });
    };
    
  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>
                  View, manage, and invite all user accounts in the system.
                </CardDescription>
            </div>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="gap-1" aria-label="Bulk Invite Users">
                        <UserPlus className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Bulk Invite
                        </span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Invite Users</DialogTitle>
                        <DialogDescription>
                            Upload a CSV file with user emails and full names to invite them. The file must contain 'email' and 'fullName' columns.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="csv-upload">CSV File</Label>
                            <Input id="csv-upload" type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} />
                        </div>
                        {csvFile && <p className="text-sm text-muted-foreground">Selected file: {csvFile.name}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleBulkInvite} disabled={!csvFile}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload and Send Invites
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
             ) : users.length > 0 ? (
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
             ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No users found in the system.
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
