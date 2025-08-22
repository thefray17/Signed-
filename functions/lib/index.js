"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensurerootclaims = exports.assignuserrole = exports.onauthcreate = void 0;
const v2_1 = require("firebase-functions/v2");
const identity_1 = require("firebase-functions/v2/identity");
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
(0, v2_1.setGlobalOptions)({
    region: "asia-southeast1",
});
(0, app_1.initializeApp)();
const ROOT = "eballeskaye@gmail.com";
/** Make root admin + isRoot on first auth create */
exports.onauthcreate = (0, identity_1.onUserCreated)(async (event) => {
    const user = event.data;
    const db = (0, firestore_1.getFirestore)();
    const auth = (0, auth_1.getAuth)();
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
        await db.doc(`users/${user.uid}`).set({ ...base, role: "admin", status: "approved", isRoot: true, onboardingComplete: true, updatedAt: Date.now() }, { merge: true });
    }
    else {
        // The client-side form also creates a doc. We use merge:true to not clobber it
        // if it gets created first. This function acts as the final authority.
        await db.doc(`users/${user.uid}`).set(base, { merge: true });
    }
});
/** Only root can assign Admin; Admin (or root) can assign Co-admin; nobody can change the root user */
exports.assignuserrole = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Sign in");
    const { targetUserId, role } = (request.data || {});
    if (!targetUserId || !role)
        throw new https_1.HttpsError("invalid-argument", "targetUserId and role are required");
    const auth = (0, auth_1.getAuth)();
    const callerEmail = String(request.auth.token.email || "").toLowerCase();
    const isRootCaller = !!request.auth.token.isRoot || callerEmail === ROOT;
    const callerRole = String(request.auth.token.role || "");
    // Prevent anyone from modifying the root user (even the root themself)
    const target = await auth.getUser(targetUserId);
    if ((target.email || "").toLowerCase() === ROOT) {
        throw new https_1.HttpsError("permission-denied", "Root admin cannot be modified.");
    }
    if (role === "admin" && !isRootCaller)
        throw new https_1.HttpsError("permission-denied", "Only root can assign Admin.");
    if (role === "coadmin" && !isRootCaller && callerRole !== 'admin')
        throw new https_1.HttpsError("permission-denied", "Only Admin can assign Co-admin.");
    await auth.setCustomUserClaims(targetUserId, { role, isRoot: false }); // never grant isRoot here
    await (0, firestore_1.getFirestore)().doc(`users/${targetUserId}`).set({ role, isRoot: false, updatedAt: Date.now() }, { merge: true });
    return { ok: true };
});
exports.ensurerootclaims = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Sign in");
    }
    const email = String(request.auth.token.email || "").toLowerCase();
    if (email !== ROOT) {
        throw new https_1.HttpsError("permission-denied", "Root only");
    }
    const uid = request.auth.uid;
    await (0, auth_1.getAuth)().setCustomUserClaims(uid, { role: "admin", isRoot: true });
    await (0, firestore_1.getFirestore)().doc(`users/${uid}`).set({ role: "admin", isRoot: true, status: "approved", updatedAt: Date.now() }, { merge: true });
    return { ok: true };
});
