
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { onIdTokenChanged, User as FirebaseUser, getIdTokenResult } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase-client';
import { db } from '@/lib/firebase-app';
import type { AppUser } from '@/types';
import { FileSignature } from 'lucide-react';

export interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROOT_ADMIN_EMAIL = "eballeskaye@gmail.com";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const token = await getIdTokenResult(fbUser, true);
        const claims = token.claims as any;

        const email = (fbUser.email ?? "").toLowerCase();
        const isRoot = !!claims.isRoot || email === ROOT_ADMIN_EMAIL;

        const userDoc = await getDoc(doc(db, "users", fbUser.uid));
        const firestoreData = userDoc.exists() ? (userDoc.data() as any) : {};

        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          role: isRoot ? "admin" : (claims.role as string) || firestoreData.role || "user",
          isRoot,
          office: firestoreData.office ?? null,
          officeName: firestoreData.officeName,
          status: firestoreData.status ?? "pending",
          onboardingComplete: firestoreData.onboardingComplete ?? false,
        } as AppUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
