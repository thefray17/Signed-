// functions/src/index.ts
import { setGlobalOptions } from "firebase-functions/v2";
import { onUserCreated } from "firebase-functions/v2/auth"; // ✅ correct module
import { onCall, HttpsError } from "firebase-functions/v2/https";
import type { CloudEvent } from "firebase-functions/v2";
import type { UserRecord } from "firebase-admin/auth";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

setGlobalOptions({
  region: "asia-southeast1", // Singapore
  runtime: { memoryMiB: 256, timeoutSeconds: 60 }, // tweak as you like
});

initializeApp();

const db = getFirestore();
const auth = getAuth();

// 👇 Change to your true root email (lowercase)
const ROOT_EMAIL = "eballeskaye@gmail.com".toLowerCase();

/**
 * 1) When a user account is created:
 *    - Create a base user doc
 *    - If root account, promote to admin + isRoot
 */
export const onAuthCreate = onUserCreated(async (event: CloudEvent<UserRecord>) => {
  const user = event.data;
  if (!user) return;

  const base = {
    email: (user.email ?? "").toLowerCase(),
    role: "user" as "user" | "coadmin" | "admin",
    status: "pending" as "pending" | "approved" | "disabled",
    onboardingComplete: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Create/merge base user doc
  await db.doc(`users/${user.uid}`).set(base, { merge: true });

  // If this is the root email, grant admin + isRoot
  if (base.email === ROOT_EMAIL) {
    await auth.setCustomUserClaims(user.uid, { role: "admin", isRoot: true });
    await db.doc(`users/${user.uid}`).set(
      { role: "admin", status: "approved", isRoot: true, updatedAt: Date.now() },
      { merge: true }
    );
  }
});

/**
 * 2) Callable to assign roles.
 *    - Only root can assign "admin"
 *    - Admin or root can assign "coadmin" / "user"
 *    - Writes both custom claims and Firestore doc
 */
export const assignUserRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in first.");
  }

  const caller = request.auth;
  const callerEmail = String(caller.token.email || "").toLowerCase();
  const callerIsRoot = caller.token.isRoot === true;
  const callerIsAdmin = caller.token.role === "admin" || callerIsRoot;

  const { targetUserId, role } = (request.data || {}) as {
    targetUserId?: string;
    role?: "user" | "coadmin" | "admin";
  };

  if (!targetUserId || !role) {
    throw new HttpsError("invalid-argument", "Provide targetUserId and role.");
  }

  // Permission checks
  if (role === "admin" && !callerIsRoot) {
    throw new HttpsError("permission-denied", "Only root can assign admin.");
  }
  if ((role === "coadmin" || role === "user") && !callerIsAdmin) {
    throw new HttpsError("permission-denied", "Only admin/root can assign this role.");
  }

  // Update claims
  await auth.setCustomUserClaims(targetUserId, { role });

  // Update Firestore user doc
  await db.doc(`users/${targetUserId}`).set(
    { role, updatedAt: Date.now() },
    { merge: true }
  );

  return { ok: true };
});

/**
 * 3) Callable to ensure the caller (root email) has admin + isRoot.
 *    Useful if the root signed in before the trigger ran, etc.
 */
export const ensureRootClaims = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in first.");
  }
  const email = String(request.auth.token.email || "").toLowerCase();
  if (email !== ROOT_EMAIL) {
    throw new HttpsError("permission-denied", "Root only.");
  }

  const uid = request.auth.uid;
  await auth.setCustomUserClaims(uid, { role: "admin", isRoot: true });
  await db.doc(`users/${uid}`).set(
    { role: "admin", isRoot: true, status: "approved", updatedAt: Date.now() },
    { merge: true }
  );

  return { ok: true };
});
