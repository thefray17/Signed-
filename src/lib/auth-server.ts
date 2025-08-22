import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin-app";
import type { AppUser, UserRole } from "@/types";
import { DecodedIdToken } from "firebase-admin/auth";

const ROOT_ADMIN_EMAIL = process.env.ROOT_ADMIN_EMAIL;

export async function getCurrentUserWithRole(): Promise<AppUser | null> {
  const jar = cookies();
  const token = jar.get("session")?.value || jar.get("__session")?.value;
  if (!token) return null;

  const auth = adminAuth();
  let decoded: DecodedIdToken;

  // Try session cookie; fall back to raw ID token (emulator)
  try {
    decoded = await auth.verifySessionCookie(token, true);
  } catch {
    try {
      decoded = await auth.verifyIdToken(token, true);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[auth-server] verify failed:", e);
      return null;
    }
  }

  const uid = decoded.uid;
  let role: UserRole | null = (decoded as any)?.role ?? null;

  const db = adminDb();
  const userDoc = await db.doc(`users/${uid}`).get();
  const firestoreData = userDoc.exists() ? (userDoc.data() as AppUser) : null;

  if (!role && firestoreData?.role) {
    role = firestoreData.role;
  }

  const email = (decoded.email as string | undefined) ?? null;
  if (ROOT_ADMIN_EMAIL && email && email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()) {
    role = "root";
  }

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
}
