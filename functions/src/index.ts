import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

const ROOT = "eballeskaye@gmail.com";

/**
 * Gen-1 auth trigger: make root email an admin, others start pending.
 */
export const onAuthCreate = functions.auth.user().onCreate(async (user) => {
  const db = getFirestore();
  const auth = getAuth();

  const base = {
    email: user.email ?? "",
    role: "user",
    status: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  if (user.email?.toLowerCase() === ROOT) {
    await auth.setCustomUserClaims(user.uid, { role: "admin" });
    await db.doc(`users/${user.uid}`).set(
      { ...base, role: "admin", status: "approved", updatedAt: Date.now() },
      { merge: true }
    );
  } else {
    await db.doc(`users/${user.uid}`).set(base, { merge: true });
  }
});

/**
 * Gen-1 callable: admins can grant coadmin; only root can grant admin.
 */
export const assignUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in");
  }

  const { targetUserId, role } = (data || {}) as {
    targetUserId?: string;
    role?: "user" | "coadmin" | "admin";
  };

  if (!targetUserId || !role) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "targetUserId and role are required"
    );
  }

  const callerEmail = String(context.auth.token.email || "").toLowerCase();
  const callerRole = String(context.auth.token.role || "");

  if (role === "admin" && callerEmail !== ROOT) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only root admin can assign admin"
    );
  }
  if (role === "coadmin" && !(callerRole === "admin" || callerEmail === ROOT)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admin can assign coadmin"
    );
  }

  await getAuth().setCustomUserClaims(targetUserId, { role });
  await getFirestore()
    .doc(`users/${targetUserId}`)
    .set({ role, updatedAt: Date.now() }, { merge: true });

  return { ok: true };
});
