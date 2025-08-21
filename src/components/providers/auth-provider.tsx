
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Fetch extended user profile from Firestore and custom claims
        const userDocRef = doc(db, 'users', fbUser.uid);
        const [userDoc, tokenResult] = await Promise.all([
            getDoc(userDocRef),
            getIdTokenResult(fbUser, true), // Force refresh to get latest claims
        ]);
        
        const claims = tokenResult.claims;

        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          setUser({ 
              uid: fbUser.uid, 
              ...firestoreData,
              isRoot: !!claims.isRoot, // Set isRoot from claims
              role: claims.role || firestoreData.role, // Prioritize claim role
          } as AppUser);
        } else {
            // This might be a new user who hasn't completed onboarding
            setUser({
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName,
                role: 'user',
                office: null,
                status: 'pending',
                onboardingComplete: false,
                isRoot: !!claims.isRoot,
            });
        }
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
