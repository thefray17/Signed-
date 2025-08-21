"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Office } from "@/types";

import { PlusCircle, MoreHorizontal } from "lucide-react";
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
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface OfficeWithCount extends Office {
    employeeCount: number;
}

export default function OfficesPage() {
    const [offices, setOffices] = useState<OfficeWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
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
        fetchOffices();
    }, [toast]);

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
            <Button size="sm" className="gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Office
                </span>
            </Button>
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
                <TableRow>
                    <TableCell colSpan={3}>
                        <Skeleton className="h-10 w-full" />
                    </TableCell>
                </TableRow>
            ) : (
                offices.map(office => (
                  <TableRow key={office.id}>
                    <TableCell className="font-medium">{office.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{office.employeeCount}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
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
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
