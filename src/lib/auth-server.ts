
import { cookies } from "next/headers";
import { adminApp } from "@/lib/firebase-admin-app";
import type { AppUser, UserRole } from "@/types";

const ROOT_ADMIN_EMAIL = process.env.ROOT_ADMIN_EMAIL;

/** Why: single source of truth for user+role on server */
export async function getCurrentUserWithRole(): Promise<AppUser | null> {
  const sessionCookie =
    cookies().get("__session")?.value || cookies().get("session")?.value;
  if (!sessionCookie) return null;
  
  try {
    const auth = adminApp.auth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decoded.uid;
    
    const db = adminApp.firestore();
    const userDoc = await db.doc(`users/${uid}`).get();
    const firestoreData = userDoc.exists() ? (userDoc.data() as AppUser) : null;

    const email = decoded.email?.toLowerCase() ?? "";
    const isRoot = !!decoded.isRoot || (ROOT_ADMIN_EMAIL && email === ROOT_ADMIN_EMAIL.toLowerCase());

    let role: UserRole = 'user'; // Default role
    if (isRoot) {
      role = 'root';
    } else if (decoded.role && typeof decoded.role === 'string') {
      role = decoded.role as UserRole;
    } else if (firestoreData?.role) {
      role = firestoreData.role;
    }
    
    return {
      uid,
      email: decoded.email ?? null,
      displayName: firestoreData?.displayName ?? decoded.name ?? null,
      role: role,
      isRoot: isRoot,
      status: firestoreData?.status ?? 'pending',
      office: firestoreData?.office ?? null,
      officeName: firestoreData?.officeName ?? '',
      onboardingSteps: firestoreData?.onboardingSteps,
    };
  } catch (e) {
    console.error("verifySessionCookie failed:", e);
    return null;
  }
}
