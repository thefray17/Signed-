"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureRootClaims = exports.assignUserRole = exports.onAuthCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
const ROOT = "eballeskaye@gmail.com";
/** Make root admin + isRoot on first auth create */
exports.onAuthCreate = functions
    .region("asia-southeast1")
    .auth.user().onCreate(async (user) => {
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
exports.assignUserRole = functions
    .region("asia-southeast1")
    .https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "Sign in");
    const { targetUserId, role } = (data || {});
    if (!targetUserId || !role)
        throw new functions.https.HttpsError("invalid-argument", "targetUserId and role are required");
    const auth = (0, auth_1.getAuth)();
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
    if (role === "coadmin" && !isRootCaller && callerRole !== 'admin')
        throw new functions.https.HttpsError("permission-denied", "Only Admin can assign Co-admin.");
    await auth.setCustomUserClaims(targetUserId, { role, isRoot: false }); // never grant isRoot here
    await (0, firestore_1.getFirestore)().doc(`users/${targetUserId}`).set({ role, isRoot: false, updatedAt: Date.now() }, { merge: true });
    return { ok: true };
});
exports.ensureRootClaims = functions
    .region("asia-southeast1")
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Sign in");
    }
    const email = String(context.auth.token.email || "").toLowerCase();
    if (email !== ROOT) {
        throw new functions.https.HttpsError("permission-denied", "Root only");
    }
    const uid = context.auth.uid;
    await (0, auth_1.getAuth)().setCustomUserClaims(uid, { role: "admin", isRoot: true });
    await (0, firestore_1.getFirestore)().doc(`users/${uid}`).set({ role: "admin", isRoot: true, status: "approved", updatedAt: Date.now() }, { merge: true });
    return { ok: true };
});
