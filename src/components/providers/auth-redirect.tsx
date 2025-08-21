
"use client";
import { useEffect } from "react";
import { onIdTokenChanged, getIdTokenResult } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { AppUser } from "@/types";

const ROOT_ADMIN_EMAIL = "eballeskaye@gmail.com";

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user) return;

      try {
        const tokenResult = await getIdTokenResult(user, true); // Force refresh
        const claims = tokenResult.claims;
        const role = (claims.role as string) || "";

        if (user.email?.toLowerCase() === ROOT_ADMIN_EMAIL || role === "admin" || role === "co-admin") {
          // Check if already on an admin route
          if (!window.location.pathname.startsWith('/admin')) {
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
             if (!window.location.pathname.startsWith('/dashboard')) {
                router.replace('/dashboard');
             }
          } else if (userData.status === 'pending') {
            if (window.location.pathname !== '/pending-approval') {
                router.replace('/pending-approval');
            }
          } else if (userData.status === 'rejected') {
             if (window.location.pathname !== '/login') {
                await auth.signOut();
                // We don't need a toast here as the login page will handle it.
                router.replace('/login');
             }
          } else if (!userData.onboardingComplete) {
            if (window.location.pathname !== '/onboarding') {
                router.replace('/onboarding');
            }
          }
        } else {
             // If no user doc, send to onboarding
            if (window.location.pathname !== '/onboarding') {
               router.replace('/onboarding');
            }
        }

      } catch (error) {
        console.error("Error getting user token or data:", error);
        // If there's an error, sign out and redirect to login
        await auth.signOut();
        router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return null;
}
