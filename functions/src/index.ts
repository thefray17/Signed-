
import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

const ROOT = "eballeskaye@gmail.com";

/** Make root admin + isRoot on first auth create */
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

  if ((user.email || "").toLowerCase() === ROOT) {
    await auth.setCustomUserClaims(user.uid, { role: "admin", isRoot: true });
    await db.doc(`users/${user.uid}`).set(
      { ...base, role: "admin", status: "approved", isRoot: true, updatedAt: Date.now() },
      { merge: true }
    );
  } else {
    await db.doc(`users/${user.uid}`).set(base, { merge: true });
  }
});

/** Only root can assign Admin; Admin (or root) can assign Co-admin; nobody can change the root user */
export const assignUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in");

  const { targetUserId, role } = (data || {}) as { targetUserId?: string; role?: "user" | "coadmin" | "admin" };
  if (!targetUserId || !role) throw new functions.https.HttpsError("invalid-argument", "targetUserId and role are required");

  const auth = getAuth();
  const callerEmail = String(context.auth.token.email || "").toLowerCase();
  const isRootCaller = !!context.auth.token.isRoot || callerEmail === ROOT;
  const callerRole = String(context.auth.token.role || "");

  // Prevent anyone from modifying the root user (even the root themself)
  const target = await auth.getUser(targetUserId);
  if ((target.email || "").toLowerCase() === ROOT) {
    throw new functions.https.HttpsError("permission-denied", "Root admin cannot be modified.");
  }

  if (role === "admin" && !isRootCaller)
    throw new functions.https.HttpsError("permission-denied", "Only root can assign Admin.");
  if (role === "coadmin" && !(callerRole === "admin" || isRootCaller))
    throw new functions.https.HttpsError("permission-denied", "Only Admin can assign Co-admin.");

  await auth.setCustomUserClaims(targetUserId, { role, isRoot: false }); // never grant isRoot here
  await getFirestore().doc(`users/${targetUserId}`).set(
    { role, isRoot: false, updatedAt: Date.now() },
    { merge: true }
  );
  return { ok: true };
});
