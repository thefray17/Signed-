
"use client";
import { useEffect } from "react";
import { onIdTokenChanged, getIdTokenResult } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable, getFunctions } from "firebase/functions";
import { auth } from "@/lib/firebase-client";
import { db } from "@/lib/firebase-app";
import { useRouter, usePathname } from "next/navigation";
import { AppUser } from "@/types";

const ROOT_ADMIN_EMAIL = "eballeskaye@gmail.com";

const publicRoutes = ['/login', '/signup', '/'];
const authRoutes = ['/admin', '/dashboard', '/pending-approval', '/onboarding', '/rootadmin', '/coadmin'];

export default function AuthRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        if (!publicRoutes.includes(pathname)) {
            router.replace('/login');
        }
        return;
      }
      
      try {
        let tokenResult = await getIdTokenResult(user, true);
        const email = (user.email || "").toLowerCase();
        
        // Auto-heal logic
        if (email === ROOT_ADMIN_EMAIL && !tokenResult.claims.isRoot) {
          try {
            const ensure = httpsCallable(getFunctions(), "ensureRootClaims");
            await ensure({});
            tokenResult = await getIdTokenResult(user, true); // Force-reload token
          } catch (e) {
            console.error("ensureRootClaims failed", e);
          }
        }
        
        const claims = tokenResult.claims as any;
        const role = (claims.role as string) || "";
        const isRoot = !!claims.isRoot || email === ROOT_ADMIN_EMAIL;

        if (publicRoutes.includes(pathname)) {
            // User is on a public page, redirect if logged in
            if (isRoot) return router.replace("/rootadmin");
            if (role === "admin") return router.replace("/admin");
            if (role === "coadmin") return router.replace("/coadmin");
            // If just a user, we'll let the logic below handle it.
        }

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
             if (pathname !== '/onboarding') {
               router.replace('/onboarding');
            }
            return;
        }

        const userData = userDoc.data() as AppUser;

        if (isRoot) {
            if (!pathname.startsWith('/rootadmin')) router.replace('/rootadmin');
            return;
        }

        if (role === 'admin') {
            if (!pathname.startsWith('/admin') && !pathname.startsWith('/dashboard')) router.replace('/admin');
            return;
        }
        
        if (role === 'coadmin') {
            if (!pathname.startsWith('/coadmin') && !pathname.startsWith('/admin') && !pathname.startsWith('/dashboard')) router.replace('/coadmin');
            return;
        }

        // Standard user routing logic
        switch (userData.status) {
            case 'approved':
                if (!pathname.startsWith('/dashboard')) router.replace('/dashboard');
                break;
            case 'pending':
                if (!userData.onboardingComplete) {
                    if (pathname !== '/onboarding') router.replace('/onboarding');
                } else {
                    if (pathname !== '/pending-approval') router.replace('/pending-approval');
                }
                break;
            case 'rejected':
                if (pathname !== '/login') {
                    await auth.signOut();
                    router.replace('/login');
                }
                break;
            default:
                if (pathname !== '/onboarding') router.replace('/onboarding');
                break;
        }

      } catch (error) {
        console.error("Error during auth redirection:", error);
        if (pathname !== '/login') {
            await auth.signOut();
            router.replace('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  return null;
}
