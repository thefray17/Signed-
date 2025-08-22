import { setGlobalOptions } from "firebase-functions/v2";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as functions from "firebase-functions"; // v1 surface for auth trigger
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
setGlobalOptions({
    region: "asia-southeast1",
    memory: "256MiB",
    timeoutSeconds: 60
});
initializeApp();
const db = getFirestore();
const auth = getAuth();
const ROOT_EMAIL = "eballeskaye@gmail.com".toLowerCase();
export const onAuthCreate = functions
    .region("asia-southeast1")
    .auth.user()
    .onCreate(async (user) => {
    const email = (user.email ?? "").toLowerCase();
    const base = {
        email,
        role: "user",
        status: "pending",
        onboardingComplete: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    await db.doc(`users/${user.uid}`).set(base, { merge: true });
    if (email === ROOT_EMAIL) {
        await auth.setCustomUserClaims(user.uid, { role: "admin", isRoot: true });
        await db.doc(`users/${user.uid}`).set({ role: "admin", status: "approved", isRoot: true, updatedAt: Date.now() }, { merge: true });
    }
});
export const assignUserRole = onCall(async (request) => {
    if (!request.auth)
        throw new HttpsError("unauthenticated", "Sign in first.");
    const caller = request.auth;
    const callerIsRoot = caller.token.isRoot === true;
    const callerIsAdmin = caller.token.role === "admin" || callerIsRoot;
    const { targetUserId, role } = (request.data || {});
    if (!targetUserId || !role)
        throw new HttpsError("invalid-argument", "Provide targetUserId and role.");
    if (role === "admin" && !callerIsRoot)
        throw new HttpsError("permission-denied", "Only root can assign admin.");
    if ((role === "coadmin" || role === "user") && !callerIsAdmin)
        throw new HttpsError("permission-denied", "Only admin/root can assign this role.");
    await auth.setCustomUserClaims(targetUserId, { role });
    await db.doc(`users/${targetUserId}`).set({ role, updatedAt: Date.now() }, { merge: true });
    return { ok: true };
});
export const ensureRootClaims = onCall(async (request) => {
    if (!request.auth)
        throw new HttpsError("unauthenticated", "Sign in first.");
    const email = String(request.auth.token.email || "").toLowerCase();
    if (email !== ROOT_EMAIL)
        throw new HttpsError("permission-denied", "Root only.");
    const uid = request.auth.uid;
    await auth.setCustomUserClaims(uid, { role: "admin", isRoot: true });
    await db.doc(`users/${uid}`).set({ role: "admin", isRoot: true, status: "approved", updatedAt: Date.now() }, { merge: true });
    return { ok: true };
});
//# sourceMappingURL=index.js.map