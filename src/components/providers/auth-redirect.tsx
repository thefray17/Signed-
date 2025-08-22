
"use client";
import { useEffect } from "react";
import { onIdTokenChanged, getIdTokenResult } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable, getFunctions } from "firebase/functions";
import { auth } from "@/lib/firebase-client";
import { db, app } from "@/lib/firebase-app";
import { useRouter, usePathname } from "next/navigation";
import { AppUser } from "@/types";

const ROOT_ADMIN_EMAIL = "eballeskaye@gmail.com";

const publicRoutes = ['/login', '/signup', '/'];

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
            const functions = getFunctions(app, "asia-southeast1");
            const ensure = httpsCallable(functions, "ensureRootClaims");
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
            if (isRoot) return router.replace("/rootadmin");
            if (role === "admin") return router.replace("/admin");
            if (role === "coadmin") return router.replace("/coadmin");
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

        // The logic below handles routing for authenticated users.
        // It's important to check the *current* path to avoid redirect loops.

        // Root user can go anywhere, but their home is /rootadmin.
        // Don't redirect them if they are already on an allowed page.
        if (isRoot) {
            if (pathname.startsWith('/rootadmin') || pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
                return; // Already in an authorized area
            }
             router.replace('/rootadmin');
             return;
        }
        
        // Admin user routing
        if (role === 'admin') {
            if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
                return; // Already in an authorized area for admin
            }
            router.replace('/admin');
            return;
        }
        
        // Co-admin user routing
        if (role === 'coadmin') {
            if (pathname.startsWith('/coadmin') || pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
                 return; // Already in an authorized area for co-admin
            }
             router.replace('/coadmin');
             return;
        }

        // Standard user routing logic based on their status
        switch (userData.status) {
            case 'approved':
                if (!pathname.startsWith('/dashboard')) router.replace('/dashboard');
                break;
            case 'pending':
                if (!userData.onboardingSteps.profileCompleted.status) {
                    if (pathname !== '/onboarding') router.replace('/onboarding');
                } else {
                    if (pathname !== '/pending-approval') router.replace('/pending-approval');
                }
                break;
            case 'rejected':
                 // Log out and redirect to login for rejected users.
                if (pathname !== '/login') {
                    await auth.signOut();
                    router.replace('/login');
                }
                break;
            default:
                 // Default to onboarding if status is unknown or missing.
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
