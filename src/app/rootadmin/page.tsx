
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { httpsCallable, getFunctions } from "firebase/functions";
import { collection, getDocs, limit, orderBy, query, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db, app } from "@/lib/firebase-app";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

type UserRow = { id: string; email: string; role?: string; status?: string; isRoot?: boolean; createdAt?: any };

function WhoAmI() {
  const [info, setInfo] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const u = getAuth().currentUser;
      if (u) {
        const token = await u.getIdTokenResult();
        setInfo({
          email: u?.email,
          uid: u?.uid,
          claims: token?.claims,
        });
      } else {
        setInfo({ email: "Not signed in" });
      }
    })();
  }, []);
  return <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">{JSON.stringify(info, null, 2)}</pre>;
}

function RootRepair() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = async () => {
    try {
      setBusy(true);
      const fns = getFunctions(app, "asia-southeast1");
      const ensure = httpsCallable(fns, "ensureRootClaims");
      await ensure({});
      await getAuth().currentUser?.getIdToken(true);
      setMsg("Root claims asserted. Token refreshed. Reloading...");
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      setMsg(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Root Repair</CardTitle>
        <CardDescription>Re-assert your root claims and refresh your session token if you are having access issues.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Button onClick={run} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Re‑assert root & refresh token"}
          </Button>
          {msg && <div className="text-xs mt-2 text-muted-foreground">{msg}</div>}
        </div>
         <div>
          <h3 className="text-md font-semibold mb-2">Current Claims (Who Am I?)</h3>
          <WhoAmI />
        </div>
      </CardContent>
    </Card>
  );
}

function RulesInspector() {
  const [path, setPath] = useState("users/some-test-uid");
  const [operation, setOperation] = useState<'read' | 'write'>("read");
  const [result, setResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const handleTest = async () => {
    if (!path) {
        toast({
            variant: "destructive",
            title: "Path Required",
            description: "Please enter a Firestore path to test.",
        });
        return;
    }
    setIsTesting(true);
    setResult(null);
    try {
        const docRef = doc(db, path);
        if (operation === 'read') {
            await getDoc(docRef);
            setResult(`✅ SUCCESS: Read operation for path "${path}" was allowed.`);
        } else {
            await setDoc(docRef, { test_field: `test_write_${Date.now()}` }, { merge: true });
            setResult(`✅ SUCCESS: Write operation for path "${path}" was allowed.`);
        }
    } catch (error: any) {
        console.error("Rules Inspector Error:", error);
        setResult(`❌ FAILED: Operation on path "${path}" was denied.\n\nError: ${error.message}`);
    } finally {
        setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rules Inspector</CardTitle>
        <CardDescription>
          Test Firestore security rules by attempting a read or write with your current user token.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="rules-path">Firestore Path</Label>
            <Input id="rules-path" value={path} onChange={(e) => setPath(e.target.value)} placeholder="e.g., users/some-uid" />
        </div>
        <RadioGroup value={operation} onValueChange={(v: 'read' | 'write') => setOperation(v)} className="flex items-center space-x-4">
             <div className="flex items-center space-x-2">
                <RadioGroupItem value="read" id="op-read" />
                <Label htmlFor="op-read">Read (get)</Label>
            </div>
             <div className="flex items-center space-x-2">
                <RadioGroupItem value="write" id="op-write" />
                <Label htmlFor="op-write">Write (set)</Label>
            </div>
        </RadioGroup>
        <Button onClick={handleTest} disabled={isTesting}>
            {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Run Test"}
        </Button>
        {result && (
            <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto whitespace-pre-wrap">{result}</pre>
        )}
      </CardContent>
    </Card>
  );
}

function SystemHealth() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const checkHealth = async () => {
        setLoading(true);
        try {
            const functions = getFunctions(app, "asia-southeast1");
            const getHealth = httpsCallable(functions, "getFunctionHealth");
            const result = await getHealth();
            setHealth(result.data);
        } catch (error: any) {
            console.error("Error fetching system health:", error);
            toast({
                variant: "destructive",
                title: "Health Check Failed",
                description: error.message || "Could not fetch system health.",
            });
            setHealth({ status: "error", error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                    Live status of the backend services.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Button onClick={checkHealth} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Run Health Check"}
                </Button>
                {health && (
                     <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(health, null, 2)}
                    </pre>
                )}
            </CardContent>
        </Card>
    )
}


export default function RootAdminPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  
  const ROOT_ADMIN_EMAIL = "eballeskaye@gmail.com";
  const email = (authUser?.email ?? "").toLowerCase();
  const allow = !!authUser && (authUser.isRoot || email === ROOT_ADMIN_EMAIL);

  useEffect(() => {
    if (authLoading) return;
    if (!allow) {
        setLoading(false);
        return;
    }

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(
                query(collection(db, "users"), orderBy("createdAt", "desc"), limit(10))
            );
            setUsers(
                snap.docs.map((d) => {
                    const x = d.data() as any;
                    return { id: d.id, email: x.email, role: x.role, status: x.status, isRoot: x.isRoot, createdAt: x.createdAt };
                })
            );
        } catch (error) {
            console.error("Error fetching users:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Could not load user data.",
            });
        } finally {
            setLoading(false);
        }
    };
    
    fetchUsers();

  }, [authUser, authLoading, toast, allow]);

  async function setRole(uid: string, role: "user" | "coadmin" | "admin") {
    try {
        const functions = getFunctions(app, "asia-southeast1");
        const fn = httpsCallable(functions, "assignUserRole");
        await fn({ targetUserId: uid, role });
        setUsers((prev) =>
          prev.map((u) => (u.id === uid ? { ...u, role, isRoot: false } : u))
        );
        toast({
          title: "Role Updated",
          description: `User role has been successfully changed to ${role}.`,
        });
        await getAuth().currentUser?.getIdToken(true);
    } catch (error: any) {
        console.error("Failed to set role:", error);
        toast({
          variant: "destructive",
          title: "Error Updating Role",
          description: error.message || "An unknown error occurred.",
        });
    }
  }

  if (authLoading || loading) {
     return (
        <Card>
          <CardHeader><CardTitle>Loading User Management...</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
     )
  }

  if (!allow) {
    return (
      <Card>
        <CardHeader><CardTitle>403 — Root Admin Only</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">You don’t have access to this page.</p>
          <div className="mt-4"><Link href="/dashboard"><Button>Go to Dashboard</Button></Link></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Users (latest 10)</CardTitle>
                    <CardDescription>View and manage all user roles directly. This is the highest level of user administration.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-auto">
                {users.length === 0 && <div className="text-sm text-muted-foreground p-4 text-center">No users found.</div>}
                {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between border rounded-md p-3">
                    <div className="min-w-0">
                        <div className="font-medium truncate">{u.email}</div>
                        <div className="text-xs text-muted-foreground space-x-2">
                        <span>role: <Badge variant="secondary">{u.role || "user"}</Badge></span>
                        <span>status: <Badge variant={u.status === 'approved' ? 'default' : 'outline'}>{u.status || "pending"}</Badge></span>
                        {u.isRoot && <Badge variant="destructive">Root</Badge>}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {u.isRoot ? null : (
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
            <RulesInspector />
        </div>

        <div className="space-y-6">
            <SystemHealth />
            <RootRepair />
        </div>
    </div>
  );
}
