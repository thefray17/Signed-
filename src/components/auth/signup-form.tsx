"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase-client";
import { db } from "@/lib/firebase-app";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

// This is checked by the Cloud Function, but we can use it for client-side hints.
const ADMIN_EMAIL = "eballeskaye@gmail.com";

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: values.fullName,
      });
      
      const isRootAdmin = values.email.toLowerCase() === ADMIN_EMAIL;
      
      // The Cloud Function `onauthcreate` will handle setting custom claims
      // and creating the user document in Firestore. We can skip creating the
      // doc here to avoid race conditions and have a single source of truth.
      
      // However, for a better UX, we create a basic doc here so the user can
      // proceed without waiting for the function to run, which can have a slight delay.
      // The function will overwrite this with authoritative data.
       if (!isRootAdmin) {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            displayName: values.fullName,
            email: values.email,
            role: 'user',
            office: null,
            status: 'pending',
            onboardingComplete: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
       }


      toast({
        title: "Account Created",
        description: isRootAdmin 
            ? "Welcome, Admin! Your account is ready." 
            : "Your account has been created. Please complete your profile.",
      });
      
      // The AuthRedirect component will handle routing based on claims and status.
      // We don't need to manually push the router here. If we do, it might race
      // with the redirect component and cause a flicker.

    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.code === 'auth/email-already-in-use' 
            ? 'This email is already registered. Please sign in.'
            : error.message || "An unknown error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
