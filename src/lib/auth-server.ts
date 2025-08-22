
import { cookies } from "next/headers";
import { adminApp } from "@/lib/firebase-admin-app";
import type { AppUser, UserRole } from "@/types";

const ROOT_ADMIN_EMAIL = process.env.ROOT_ADMIN_EMAIL;

/** Why: single source of truth for user+role on server */
export async function getCurrentUserWithRole(): Promise<AppUser | null> {
  const jar = cookies();
  const session = jar.get("session")?.value || jar.get("__session")?.value;
  if (!session) return null;

  try {
    const auth = adminApp.auth();
    const decoded = await auth.verifySessionCookie(session, true);
    const uid = decoded.uid;

    // 1) custom claims
    let role = (decoded as any).role as UserRole | undefined;

    // 2) Firestore fallback
    if (!role) {
      const db = adminApp.firestore();
      const doc = await db.doc(`users/${uid}`).get();
      const firestoreData = doc.exists() ? (doc.data() as AppUser) : null;
      role = (firestoreData?.role as UserRole | undefined) ?? role;
    }

    // 3) Root email override
    const email = decoded.email ?? null;
    if (ROOT_ADMIN_EMAIL && email && email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()) {
      role = "root";
    }

    const db = adminApp.firestore();
    const userDoc = await db.doc(`users/${uid}`).get();
    const firestoreData = userDoc.exists() ? (userDoc.data() as AppUser) : null;

    return {
      uid,
      email,
      displayName: firestoreData?.displayName ?? (decoded as any).name ?? null,
      role: (role ?? "user") as UserRole,
      isRoot: role === 'root',
      status: firestoreData?.status ?? 'pending',
      office: firestoreData?.office ?? null,
      officeName: firestoreData?.officeName ?? '',
      onboardingSteps: firestoreData?.onboardingSteps,
    };
  } catch (e) {
    console.error("verifySessionCookie failed:", e);
    // Clear the invalid cookie
    cookies().delete('session');
    cookies().delete('__session');
    return null;
  }
}
