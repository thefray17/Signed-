
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-app";
import type { Office } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { PlusCircle, MoreHorizontal, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface OfficeWithCount extends Office {
    employeeCount: number;
}

const addOfficeSchema = z.object({
  name: z.string().min(3, "Office name must be at least 3 characters."),
});

export default function OfficesPage() {
    const [offices, setOffices] = useState<OfficeWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOfficeOpen, setIsAddOfficeOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof addOfficeSchema>>({
      resolver: zodResolver(addOfficeSchema),
      defaultValues: { name: "" },
    });
    
    const fetchOffices = async () => {
        setLoading(true);
        try {
            const officesCollection = collection(db, "offices");
            const officeSnapshot = await getDocs(officesCollection);
            const officesList = officeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Office));
            
            const usersCollection = collection(db, "users");
            const usersSnapshot = await getDocs(usersCollection);
            const userCountByOffice = usersSnapshot.docs.reduce((acc, userDoc) => {
                const officeId = userDoc.data().office;
                if(officeId) {
                    acc[officeId] = (acc[officeId] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);

            const officesWithCount = officesList.map(office => ({
                ...office,
                employeeCount: userCountByOffice[office.id] || 0
            }));

            setOffices(officesWithCount);

        } catch (error) {
             console.error("Error fetching offices: ", error);
             toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load offices.",
             });
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchOffices();
    }, []);

    async function onAddOfficeSubmit(values: z.infer<typeof addOfficeSchema>) {
        try {
            await addDoc(collection(db, "offices"), {
                name: values.name,
                visibility: "public",
                status: "active",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            toast({
                title: "Office Added",
                description: `The office "${values.name}" has been created.`,
            });
            form.reset();
            setIsAddOfficeOpen(false);
            fetchOffices(); // Refresh the list
        } catch (error) {
            console.error("Error adding office:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not add the office. Please try again.",
            });
        }
    }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Manage Offices</CardTitle>
                <CardDescription>
                  Add, edit, or remove offices and departments.
                </CardDescription>
            </div>
             <Dialog open={isAddOfficeOpen} onOpenChange={setIsAddOfficeOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="gap-1" aria-label="Add Office">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Office
                        </span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a New Office</DialogTitle>
                        <DialogDescription>
                            Enter the name of the new office or department.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onAddOfficeSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Office Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Mayor's Office" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : "Add Office"}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Office Name</TableHead>
              <TableHead className="hidden md:table-cell">Employee Count</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={3}>
                            <Skeleton className="h-10 w-full" />
                        </TableCell>
                    </TableRow>
                ))
            ) : offices.length > 0 ? (
                offices.map(office => (
                  <TableRow key={office.id}>
                    <TableCell className="font-medium">{office.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{office.employeeCount}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-label="Open office actions menu" aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        No offices found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
