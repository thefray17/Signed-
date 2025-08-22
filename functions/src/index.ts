import { setGlobalOptions } from "firebase-functions/v2";
import { onUserCreated } from "firebase-functions/v2/auth";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import type { CloudEvent } from "firebase-functions/v2";
import type { UserRecord } from "firebase-admin/auth";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

setGlobalOptions({ region: "asia-southeast1", memoryMiB: 256, timeoutSeconds: 60 });

initializeApp();
const db = getFirestore();
const auth = getAuth();
const ROOT_EMAIL = "eballeskaye@gmail.com".toLowerCase();

export const onauthcreate = onUserCreated(async (event: CloudEvent<UserRecord>) => {
  const user = event.data;
  if (!user) return;

  const email = (user.email ?? "").toLowerCase();
  const base = {
    email,
    role: "user" as const,
    status: "pending" as const,
    onboardingComplete: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await db.doc(`users/${user.uid}`).set(base, { merge: true });

  if (email === ROOT_EMAIL) {
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
export const assignuserrole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in first.");
  }

  const caller = request.auth;
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
   // Prevent anyone from modifying the root user (even the root themself)
  const target = await auth.getUser(targetUserId);
  if ((target.email || "").toLowerCase() === ROOT_EMAIL) {
    throw new HttpsError("permission-denied", "Root admin cannot be modified.");
  }

  // Update claims
  await auth.setCustomUserClaims(targetUserId, { role, isRoot: false }); // never grant isRoot here

  // Update Firestore user doc
  await db.doc(`users/${targetUserId}`).set(
    { role, isRoot: false, updatedAt: Date.now() },
    { merge: true }
  );

  return { ok: true };
});


/**
 * 3) Callable to ensure the caller (root email) has admin + isRoot.
 *    Useful if the root signed in before the trigger ran, etc.
 */
export const ensurerootclaims = onCall(async (request) => {
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
