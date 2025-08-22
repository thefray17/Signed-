"use client";
import * as React from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase-app";
import { onIdTokenChanged, getIdTokenResult } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-app";
import type { AppUser } from "@/types";
import { FileSignature } from "lucide-react";


type Claims = Record<string, unknown> | null;

export interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  claims: Claims;
  loading: boolean;
  error: string | null;
  refreshClaims: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const isEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
const ROOT_ADMIN_EMAIL = "eballeskaye@gmail.com";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getClaimsWithRetry(user: FirebaseUser): Promise<Claims> {
  // Try without refresh first to avoid network churn.
  try {
    const res = await getIdTokenResult(user, false);
    return (res?.claims as Claims) ?? {};
  } catch (e: any) {
    // If emulator is down or offline, avoid spamming.
    if (isEmulator && /network/i.test(String(e?.message || e))) {
      return {};
    }
  }

  // Retry with limited backoff, refreshing once.
  const delays = [200, 500, 1000]; // ms
  for (let i = 0; i < delays.length; i++) {
    try {
      const res = await getIdTokenResult(user, true); // refresh once during retries
      return (res?.claims as Claims) ?? {};
    } catch (e: any) {
      // Network-only: keep trying; others: break early.
      const msg = String(e?.message || e);
      if (!/network/i.test(msg) && !/timeout/i.test(msg)) {
        throw e;
      }
      await sleep(delays[i]);
    }
  }
  // Give up but keep user signed-in; return empty claims to keep UI usable.
  return {};
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = React.useState<FirebaseUser | null>(null);
  const [user, setUser] = React.useState<AppUser | null>(null);
  const [claims, setClaims] = React.useState<Claims>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const mounted = React.useRef(true);
  React.useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadData = React.useCallback(async (fbUser: FirebaseUser) => {
    try {
        if (!mounted.current) return;
        setError(null);

        const [tokenClaims, userDoc] = await Promise.all([
             getClaimsWithRetry(fbUser),
             getDoc(doc(db, "users", fbUser.uid))
        ]);

        if (!mounted.current) return;

        setClaims(tokenClaims);
        const firestoreData = userDoc.exists() ? (userDoc.data() as any) : {};
        
        const email = (fbUser.email ?? "").toLowerCase();
        const isRoot = !!tokenClaims.isRoot || email === ROOT_ADMIN_EMAIL;

        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          role: isRoot ? "root" : (tokenClaims.role as string) || firestoreData.role || "user",
          isRoot,
          office: firestoreData.office ?? null,
          officeName: firestoreData.officeName,
          status: firestoreData.status ?? "pending",
          onboardingSteps: firestoreData.onboardingSteps,
        } as AppUser);

    } catch (e: any) {
      if (mounted.current) {
        setClaims({});
        setError(e?.message || "Failed to load user data");
      }
    }
  }, []);


  React.useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await loadData(fbUser);
      } else {
        setUser(null);
        setClaims(null);
      }
      if (mounted.current) setLoading(false);
    });

    const interval = setInterval(async () => {
      if (auth.currentUser) {
        try {
          await auth.currentUser.getIdToken(!isEmulator);
        } catch { /* ignore refresh errors */ }
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [loadData]);
  
  const refreshClaims = React.useCallback(async () => {
    if (auth.currentUser) {
      await loadData(auth.currentUser);
    }
  }, [loadData]);


  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="flex flex-col items-center space-y-4">
                <FileSignature className="h-12 w-12 text-primary animate-pulse" />
                <div className="space-y-2 text-center">
                    <p className="text-lg font-semibold text-foreground">Loading Signed!</p>
                    <p className="text-sm text-muted-foreground">Please wait a moment...</p>
                </div>
            </div>
        </div>
    )
  }
  
  const value: AuthContextType = React.useMemo(
    () => ({ user, firebaseUser, claims, loading, error, refreshClaims }),
    [user, firebaseUser, claims, loading, error, refreshClaims]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
