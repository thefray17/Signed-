
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { app } from "@/lib/firebase-app";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";


export function LoginForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";
  const { toast } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const auth = getAuth(app);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      // Force refresh to avoid stale/empty tokens after sign-in
      const idToken = await cred.user.getIdToken(true);
      if (!idToken || typeof idToken !== "string") {
        throw new Error("No ID token from Firebase client");
      }

      const r = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, remember }),
      });

      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to create session");
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      router.replace(next);
      router.refresh(); 
    } catch (e: any) {
      console.error(e);
      let errorMessage = e?.message || "Login failed";
      if (e.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Login to Signed!</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" checked={remember} onCheckedChange={(checked) => setRemember(!!checked)} />
                <Label htmlFor="remember" className="text-sm font-normal">Remember me</Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
