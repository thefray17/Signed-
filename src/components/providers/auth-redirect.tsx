
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
const authRoutes = ['/login', '/signup'];

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
        
        // Auto-heal logic for root user
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

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
             if (pathname !== '/onboarding') {
               router.replace('/onboarding');
            }
            return;
        }

        const userData = userDoc.data() as AppUser;
        const isAuthRoute = authRoutes.includes(pathname);

        // --- Routing for AUTHENTICATED users ---

        // If user is on login/signup page, redirect them away
        if (isAuthRoute) {
            if (isRoot) return router.replace("/rootadmin");
            if (role === "admin") return router.replace("/admin");
            if (role === "coadmin") return router.replace("/coadmin");
            if (userData.status === "approved") return router.replace("/dashboard");
             return router.replace("/onboarding"); // Default redirect if state is unclear
        }

        // Standard user routing logic based on their profile status
        if (userData.status === 'pending') {
            const profileCompleted = userData.onboardingSteps?.profileCompleted?.status;
            if (!profileCompleted) {
                if (pathname !== '/onboarding') router.replace('/onboarding');
            } else {
                if (pathname !== '/pending-approval') router.replace('/pending-approval');
            }
            return; // Exit here for pending users
        }

        if (userData.status === 'rejected') {
            // Log out and redirect to login for rejected users.
            if (pathname !== '/login') {
                await auth.signOut();
                router.replace('/login');
            }
            return; // Exit here for rejected users
        }

        // --- Role-based access control for APPROVED users ---
        
        // Root user can go anywhere, but their home is /rootadmin.
        if (isRoot) {
            // They can access /rootadmin, /admin, and /dashboard.
            if (pathname.startsWith('/rootadmin') || pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
                return; // Already in an authorized area
            }
            // For any other authenticated page, redirect to their main dashboard.
            router.replace('/rootadmin');
            return;
        }
        
        // Admin user routing
        if (role === 'admin') {
            // They can access /admin and /dashboard.
            if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
                return; // Already in an authorized area for admin
            }
             // Block access to /rootadmin
            if (pathname.startsWith('/rootadmin')) {
                router.replace('/admin');
                return;
            }
            router.replace('/admin');
            return;
        }
        
        // Co-admin user routing
        if (role === 'coadmin') {
            if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
                 return; // Already in an authorized area for co-admin
            }
             // Block access to /rootadmin
            if (pathname.startsWith('/rootadmin')) {
                router.replace('/admin');
                return;
            }
             router.replace('/coadmin');
             return;
        }

        // Standard 'user' role routing
        if (role === 'user' && userData.status === 'approved') {
            if (pathname.startsWith('/dashboard')) {
                return; // Already in their dashboard
            }
             // Block access to admin areas
            if (pathname.startsWith('/admin') || pathname.startsWith('/rootadmin')) {
                router.replace('/dashboard');
                return;
            }
            if (!pathname.startsWith('/dashboard')) router.replace('/dashboard');
            return;
        }
        
        // Fallback for any unhandled case
        // This can happen if claims/db data is inconsistent.
        console.warn("Unhandled auth redirection case. Defaulting to login.");
        await auth.signOut();
        router.replace('/login');


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
