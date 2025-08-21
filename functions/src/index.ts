
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onUserCreated } from "firebase-functions/v2/auth";
import { onCall, HttpsError } from "firebase-functions/v2/https";

initializeApp();

const ROOT = "eballeskaye@gmail.com";

/**
 * Bootstrap root admin on first sign-in (Gen 2).
 */
export const onAuthCreate = onUserCreated(async (event) => {
  const user = event.data;
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
 * Assign roles (admins can grant coadmin; only root can grant admin).
 */
export const assignUserRole = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Sign in");

  const { targetUserId, role } = req.data || {};
  if (!targetUserId || !role) {
    throw new HttpsError("invalid-argument", "targetUserId and role are required");
  }

  const callerEmail = String(req.auth.token.email || "").toLowerCase();
  const callerRole = String(req.auth.token.role || "");

  if (role === "admin" && callerEmail !== ROOT) {
    throw new HttpsError("permission-denied", "Only root admin can assign admin");
  }
  if (role === "coadmin" && !(callerRole === "admin" || callerEmail === ROOT)) {
    throw new HttpsError("permission-denied", "Only admin can assign coadmin");
  }

  await getAuth().setCustomUserClaims(targetUserId, { role });
  await getFirestore().doc(`users/${targetUserId}`).set(
    { role, updatedAt: Date.now() },
    { merge: true }
  );
  return { ok: true };
});
