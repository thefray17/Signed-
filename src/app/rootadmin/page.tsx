
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getIdTokenResult } from "firebase/auth";
import { httpsCallable, getFunctions } from "firebase/functions";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { auth } from "@/lib/firebase-client";
import { db, app } from "@/lib/firebase-app";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type UserRow = { id: string; email: string; role?: string; status?: string; isRoot?: boolean; createdAt?: any };

export default function RootAdminPage() {
  const [isRoot, setIsRoot] = useState<boolean>(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const u = auth.currentUser;
      if (!u) {
          setLoading(false);
          return;
      };

      try {
        const tok = await getIdTokenResult(u, true);
        const claims = tok.claims as any;
        const email = (u.email || "").toLowerCase();
        const root = !!claims.isRoot || email === "eballeskaye@gmail.com";
        setIsRoot(root);

        if (root) {
          const snap = await getDocs(
            query(collection(db, "users"), orderBy("createdAt", "desc"), limit(100))
          );
          setUsers(
            snap.docs.map((d) => {
              const x = d.data() as any;
              return { id: d.id, email: x.email, role: x.role, status: x.status, isRoot: x.isRoot, createdAt: x.createdAt };
            })
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load user data.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        checkAuthAndFetchData();
      } else {
        setLoading(false); // No user, stop loading
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [toast, router]);

  async function setRole(uid: string, role: "user" | "coadmin" | "admin") {
    try {
        const fn = httpsCallable(getFunctions(app), "assignUserRole");
        await fn({ targetUserId: uid, role });
        setUsers((prev) =>
          prev.map((u) => (u.id === uid ? { ...u, role, isRoot: false } : u))
        );
        toast({
          title: "Role Updated",
          description: `User role has been successfully changed to ${role}.`,
        });
    } catch (error: any) {
        console.error("Failed to set role:", error);
        toast({
          variant: "destructive",
          title: "Error Updating Role",
          description: error.message || "An unknown error occurred.",
        });
    }
  }

  if (loading) {
     return (
        <div className="p-6">
            <Card>
              <CardHeader><CardTitle>Loading Root Dashboard...</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
        </div>
     )
  }

  if (!isRoot) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle>403 — Root Admin Only</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">You don’t have access to this page.</p>
            <div className="mt-4"><Link href="/dashboard"><Button>Go to Dashboard</Button></Link></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <div className="text-sm text-muted-foreground">
          Full control (including Admin promotions). Co-admins cannot access this page.
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Users (latest 100)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {users.length === 0 && <div className="text-sm text-muted-foreground">No users found.</div>}
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between border rounded-md p-3">
              <div className="min-w-0">
                <div className="font-medium">{u.email}</div>
                <div className="text-xs text-muted-foreground">
                  role: <Badge variant="secondary">{u.role || "user"}</Badge> · status: {u.status || "pending"}
                  {u.isRoot && <span className="ml-2 text-xs font-bold text-destructive">(root)</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {u.isRoot ? (
                  <Badge>Root</Badge>
                ) : (
                  <>
                    <Button size="sm" variant={u.role === 'user' ? 'default' : 'outline'} onClick={() => setRole(u.id, "user")}>User</Button>
                    <Button size="sm" variant={u.role === 'coadmin' ? 'default' : 'outline'} onClick={() => setRole(u.id, "coadmin")}>Co-admin</Button>
                    <Button size="sm" variant={u.role === 'admin' ? 'destructive' : 'outline'} onClick={() => setRole(u.id, "admin")}>Admin</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Quick links</CardTitle></CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Link href="/admin"><Button variant="outline">Admin Dashboard</Button></Link>
          <Link href="/onboarding"><Button variant="outline">Onboarding (test)</Button></Link>
           <Link href="/dashboard"><Button variant="outline">User Dashboard</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
