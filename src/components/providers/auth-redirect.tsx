
"use client";
import { useEffect } from "react";
import { onIdTokenChanged, getIdTokenResult } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase-client";
import { db } from "@/lib/firebase-app";
import { useRouter, usePathname } from "next/navigation";
import { AppUser } from "@/types";

const ROOT_ADMIN_EMAIL = "eballeskaye@gmail.com";

const publicRoutes = ['/login', '/signup', '/'];
const authRoutes = ['/admin', '/dashboard', '/pending-approval', '/onboarding', '/rootadmin'];

export default function AuthRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        // If user is not logged in and is trying to access a protected route,
        // redirect to login.
        if (!publicRoutes.includes(pathname)) {
            router.replace('/login');
        }
        return;
      }
      
      try {
        const tokenResult = await getIdTokenResult(user, true); // Force refresh
        const claims = tokenResult.claims as any;
        const role = (claims.role as string) || "";
        const email = (user.email || "").toLowerCase();
        const isRoot = !!claims.isRoot || email === ROOT_ADMIN_EMAIL;

        // Immediately redirect roots, admins, and co-admins based on claims
        if (isRoot) {
          if (!pathname.startsWith('/rootadmin')) {
            router.replace("/rootadmin");
          }
          return;
        }

        if (role === "admin" || role === "co-admin") {
             if (!pathname.startsWith('/admin')) {
                router.replace("/admin");
            }
            return;
        }

        // Fallback to Firestore for non-admin users
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as AppUser;
          
          if (userData.status === 'approved') {
             if (!pathname.startsWith('/dashboard')) {
                router.replace('/dashboard');
             }
          } else if (userData.status === 'pending') {
            if (pathname !== '/pending-approval') {
                router.replace('/pending-approval');
            }
          } else if (userData.status === 'rejected') {
             if (pathname !== '/login') {
                await auth.signOut();
                router.replace('/login');
             }
          } else if (!userData.onboardingComplete) {
            if (pathname !== '/onboarding') {
                router.replace('/onboarding');
            }
          }
        } else {
             // If no user doc, something is wrong, send to onboarding as a failsafe
            if (pathname !== '/onboarding') {
               router.replace('/onboarding');
            }
        }

      } catch (error) {
        console.error("Error during auth redirection:", error);
        // If there's an error, sign out and redirect to login
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
