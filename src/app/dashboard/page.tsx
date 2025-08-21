
"use client";

import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, getDocs } from "firebase/firestore";
import { PlusCircle, ArrowUpRight, FileText, CheckCircle2, XCircle, Clock, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createDocumentAction } from "./actions";
import { db } from "@/lib/firebase-app";
import type { Office } from "@/types";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const recentDocuments = [
  { id: "DOC-001", title: "Budget Proposal 2024", status: "in_transit", office: "Mayor's Office", lastUpdate: "2 hours ago" },
  { id: "DOC-002", title: "HR Policy Update", status: "signed", office: "HR Department", lastUpdate: "1 day ago" },
  { id: "DOC-003", title: "IT Infrastructure Plan", status: "rejected", office: "Accounting", lastUpdate: "3 days ago" },
  { id: "DOC-004", title: "Community Event Permit", status: "completed", office: "Clerk's Office", lastUpdate: "5 days ago" },
  { id: "DOC-005", title: "Annual Financial Report", status: "draft", office: "My Drafts", lastUpdate: "1 week ago" },
];

const addDocumentSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters long."),
    workflow: z.array(z.object({
        destinationOfficeId: z.string().min(1, "Please select a destination office."),
        recipientRole: z.string().min(2, "Recipient role must be at least 2 characters."),
    })).min(1, "At least one routing step is required."),
});

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [offices, setOffices] = useState<Office[]>([]);

  useEffect(() => {
    async function fetchOffices() {
        if (!isAddDocOpen) return;
        try {
            const officesCollection = collection(db, "offices");
            const officeSnapshot = await getDocs(officesCollection);
            const officesList = officeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Office));
            setOffices(officesList);
        } catch (error) {
            console.error("Error fetching offices: ", error);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Could not load offices for the dropdown.',
            });
        }
    }
    fetchOffices();
  }, [isAddDocOpen, toast]);


  const form = useForm<z.infer<typeof addDocumentSchema>>({
    resolver: zodResolver(addDocumentSchema),
    defaultValues: { 
        title: "", 
        workflow: [{ destinationOfficeId: "", recipientRole: "" }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "workflow",
  });

  function onAddDocumentSubmit(values: z.infer<typeof addDocumentSchema>) {
    if (!user || !user.office) {
        toast({ variant: 'destructive', title: 'Error', description: 'User or office information is missing.' });
        return;
    }
    
    const workflowWithNames = values.workflow.map(step => {
        const office = offices.find(o => o.id === step.destinationOfficeId);
        if (!office) {
             toast({ variant: 'destructive', title: 'Error', description: `Office for step could not be found.` });
             throw new Error("Office not found");
        }
        return {
            ...step,
            destinationOfficeName: office.name,
        }
    });

    startTransition(async () => {
      const result = await createDocumentAction({
        title: values.title,
        workflow: workflowWithNames,
        userId: user.uid,
        userOfficeId: user.office as string,
        userOfficeName: user.officeName || "Unknown Office",
      });

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Creation Failed",
          description: result.error,
        });
      } else {
        toast({
            title: "Document Created",
            description: "Your document has been routed for signature.",
        });
        form.reset();
        setIsAddDocOpen(false);
      }
    });
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>New Document</CardTitle>
            <CardDescription>Start a new document routing process.</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isAddDocOpen} onOpenChange={(isOpen) => {
              setIsAddDocOpen(isOpen);
              if (!isOpen) {
                form.reset();
              }
            }}>
                <DialogTrigger asChild>
                    <Button size="sm" className="w-full">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Document
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Create and Route Document</DialogTitle>
                        <DialogDescription>
                            Define the title and workflow for the document. Add steps for each office that needs to sign.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onAddDocumentSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Document Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Annual Budget Proposal 2024" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <Separator />
                            
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium">Routing Workflow</h3>
                                <ScrollArea className="h-72 w-full">
                                    <div className="pr-4">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="p-4 border rounded-md mb-4 relative">
                                                <h4 className="text-md font-semibold mb-2">Step {index + 1}</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`workflow.${index}.destinationOfficeId`}
                                                        render={({ field }) => (
                                                          <FormItem>
                                                            <FormLabel>Forward To Office</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                              <FormControl>
                                                                <SelectTrigger>
                                                                  <SelectValue placeholder="Select destination office" />
                                                                </SelectTrigger>
                                                              </FormControl>
                                                              <SelectContent>
                                                                {offices.map((office) => (
                                                                  <SelectItem key={office.id} value={office.id}>
                                                                    {office.name}
                                                                  </SelectItem>
                                                                ))}
                                                              </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                          </FormItem>
                                                        )}
                                                      />
                                                    <FormField
                                                        control={form.control}
                                                        name={`workflow.${index}.recipientRole`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Recipient Role</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="e.g., Department Head" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                 {fields.length > 1 && (
                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="icon"
                                                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                                      onClick={() => remove(index)}
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => append({ destinationOfficeId: "", recipientRole: "" })}
                                >
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Add Routing Step
                                </Button>
                                <FormMessage>{form.formState.errors.workflow?.root?.message || form.formState.errors.workflow?.message}</FormMessage>
                            </div>

                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : "Create and Send"}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">12</CardTitle>
            <CardDescription>Documents In-Transit</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Awaiting signature</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">45</CardTitle>
            <CardDescription>Documents Completed</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>In the last 30 days</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">3</CardTitle>
            <CardDescription>Documents Rejected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                <span>Requires your attention</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="px-7">
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>
            An overview of your most recent document activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Title</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Current Office</TableHead>
                <TableHead className="text-right">Last Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="font-medium">{doc.title}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      {doc.id}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge className="text-xs" variant={
                      doc.status === "signed" || doc.status === "completed" ? "default" :
                      doc.status === "rejected" ? "destructive" : "secondary"
                    }>
                      {doc.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{doc.office}</TableCell>
                  <TableCell className="text-right">{doc.lastUpdate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>1-5</strong> of <strong>23</strong> documents
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

    