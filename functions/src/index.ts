import { setGlobalOptions } from "firebase-functions/v2";
import { onUserCreated } from "firebase-functions/v2/auth";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

setGlobalOptions({
  region: "asia-southeast1",
});

initializeApp();

const ROOT = "eballeskaye@gmail.com";

/** Make root admin + isRoot on first auth create */
export const onauthcreate = onUserCreated(async (event) => {
  const user = event.data;
  const db = getFirestore();
  const auth = getAuth();

  const base = {
    email: user.email ?? "",
    role: "user",
    status: "pending",
    onboardingComplete: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  if ((user.email || "").toLowerCase() === ROOT) {
    await auth.setCustomUserClaims(user.uid, { role: "admin", isRoot: true });
    await db.doc(`users/${user.uid}`).set(
      { ...base, role: "admin", status: "approved", isRoot: true, onboardingComplete: true, updatedAt: Date.now() },
      { merge: true }
    );
  } else {
    // The client-side form also creates a doc. We use merge:true to not clobber it
    // if it gets created first. This function acts as the final authority.
    await db.doc(`users/${user.uid}`).set(base, { merge: true });
  }
});

/** Only root can assign Admin; Admin (or root) can assign Co-admin; nobody can change the root user */
export const assignuserrole = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in");

  const { targetUserId, role } = (request.data || {}) as { targetUserId?: string; role?: "user" | "coadmin" | "admin" };
  if (!targetUserId || !role) throw new HttpsError("invalid-argument", "targetUserId and role are required");

  const auth = getAuth();
  const callerEmail = String(request.auth.token.email || "").toLowerCase();
  const isRootCaller = !!request.auth.token.isRoot || callerEmail === ROOT;
  const callerRole = String(request.auth.token.role || "");

  // Prevent anyone from modifying the root user (even the root themself)
  const target = await auth.getUser(targetUserId);
  if ((target.email || "").toLowerCase() === ROOT) {
    throw new HttpsError("permission-denied", "Root admin cannot be modified.");
  }

  if (role === "admin" && !isRootCaller)
    throw new HttpsError("permission-denied", "Only root can assign Admin.");
  if (role === "coadmin" && !isRootCaller && callerRole !== 'admin')
    throw new HttpsError("permission-denied", "Only Admin can assign Co-admin.");

  await auth.setCustomUserClaims(targetUserId, { role, isRoot: false }); // never grant isRoot here
  await getFirestore().doc(`users/${targetUserId}`).set(
    { role, isRoot: false, updatedAt: Date.now() },
    { merge: true }
  );
  return { ok: true };
});

export const ensurerootclaims = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in");
  }
  const email = String(request.auth.token.email || "").toLowerCase();
  if (email !== ROOT) {
    throw new HttpsError("permission-denied", "Root only");
  }

  const uid = request.auth.uid;
  await getAuth().setCustomUserClaims(uid, { role: "admin", isRoot: true });
  await getFirestore().doc(`users/${uid}`).set(
    { role: "admin", isRoot: true, status: "approved", updatedAt: Date.now() },
    { merge: true }
  );
  return { ok: true };
});
