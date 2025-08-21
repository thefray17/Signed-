"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, updateDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { Loader2, Send } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase-app";
import type { Office } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const onboardingSchema = z.object({
  office: z.string().min(1, { message: "Please select an office." }),
  role: z.string().min(2, { message: "Role must be at least 2 characters." }),
});

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(true);

  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      role: "user",
    }
  });

  useEffect(() => {
    // AuthRedirect handles redirects, but this is a good safeguard.
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchOffices() {
      try {
        const officesCollection = collection(db, "offices");
        const officeSnapshot = await getDocs(officesCollection);
        const officesList = officeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Office));
        if (officesList.length > 0) {
            setOffices(officesList);
        }
      } catch (error) {
        console.error("Error fetching offices: ", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load offices. Please try again later.',
        });
      } finally {
        setLoadingOffices(false);
      }
    }
    fetchOffices();
  }, [toast]);

  async function onSubmit(values: z.infer<typeof onboardingSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to submit.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        office: values.office,
        role: values.role, // The role here is the requested role. Admin will confirm.
        onboardingComplete: true,
        status: 'pending',
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Profile Submitted',
        description: 'Your information has been sent for approval.',
      });

      // The AuthRedirect component will handle routing to /pending-approval
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'An error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (authLoading || loadingOffices) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="mx-auto max-w-lg w-full">
                <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Complete Your Profile</CardTitle>
          <CardDescription>
            Please select your office and enter your role to continue. This information will be verified by an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="office"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Office / Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your office" />
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
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Desired Role</FormLabel>
                     <FormControl>
                        <Input placeholder="e.g., Clerk, Officer, Dept. Head" {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit for Approval
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
