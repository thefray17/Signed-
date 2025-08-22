
"use client";

/**
 * AuthProvider with stable hook order.
 * - All hooks are unconditional and declared in the same order every render.
 * - No early returns after any hook has been called.
 * - Resilient claims loading with optional retry.
 */

import * as React from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { onIdTokenChanged, getIdTokenResult } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-app";
import type { AppUser } from "@/types";
import { auth } from "@/lib/firebase-app";
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

// Avoid conditional logic for emulator in hook positions; use a constant only.
const IS_EMULATOR = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
const ROOT_ADMIN_EMAIL = "eballeskaye@gmail.com";


function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getClaimsWithRetry(user: FirebaseUser): Promise<Claims> {
  // First try without refresh to avoid extra network calls.
  try {
    const res = await getIdTokenResult(user, false);
    return (res?.claims as Claims) ?? {};
  } catch (e: any) {
    // If emulator or transient network issue, continue to limited retries.
    const msg = String(e?.message || e);
    if (!/network|timeout/i.test(msg) && !IS_EMULATOR) {
      throw e;
    }
  }

  // Limited retries with one forced refresh.
  const delays = [200, 500, 1000];
  for (let i = 0; i < delays.length; i++) {
    try {
      const res = await getIdTokenResult(user, true);
      return (res?.claims as Claims) ?? {};
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (!/network|timeout/i.test(msg)) {
        throw e;
      }
      await sleep(delays[i]);
    }
  }
  // Don’t fail hard; return empty claims to keep UI usable.
  return {};
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 1–5) States always called in the same order.
  const [firebaseUser, setFirebaseUser] = React.useState<FirebaseUser | null>(null);
  const [user, setUser] = React.useState<AppUser | null>(null);
  const [claims, setClaims] = React.useState<Claims>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 6) Stable ref.
  const mounted = React.useRef(true);
  React.useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  // 7) Stable callback to load user data (claims and firestore doc).
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

  // 8) Public refresh function as a stable callback.
  const refreshClaims = React.useCallback(async () => {
    if (auth.currentUser) {
      await loadData(auth.currentUser);
    }
  }, [loadData]);


  // 9) Subscribe to auth token changes.
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
    return () => unsub();
  }, [loadData]);

  // 10) Optional keep-alive refresh (no conditional hooks).
  React.useEffect(() => {
    const interval = setInterval(async () => {
      if (!auth.currentUser) return;
      try {
        // Emulator tokens seldom expire; avoid forced refresh there.
        await auth.currentUser.getIdToken(!IS_EMULATOR);
      } catch {
        /* non-fatal */
      }
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);


  // 11) Always memoize value; never conditional.
  const value = React.useMemo<AuthContextType>(
    () => ({ user, firebaseUser, claims, loading, error, refreshClaims }),
    [user, firebaseUser, claims, loading, error, refreshClaims]
  );
  
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

  // Never early-return before all hooks are called.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthProvider;
