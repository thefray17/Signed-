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
exports.assignUserRole = exports.onAuthCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
const ROOT = "eballeskaye@gmail.com";
/**
 * Gen-1 auth trigger: make root email an admin, others start pending.
 */
exports.onAuthCreate = functions.auth.user().onCreate(async (user) => {
    const db = (0, firestore_1.getFirestore)();
    const auth = (0, auth_1.getAuth)();
    const base = {
        email: user.email ?? "",
        role: "user",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    if (user.email?.toLowerCase() === ROOT) {
        await auth.setCustomUserClaims(user.uid, { role: "admin" });
        await db.doc(`users/${user.uid}`).set({ ...base, role: "admin", status: "approved", updatedAt: Date.now() }, { merge: true });
    }
    else {
        await db.doc(`users/${user.uid}`).set(base, { merge: true });
    }
});
/**
 * Gen-1 callable: admins can grant coadmin; only root can grant admin.
 */
exports.assignUserRole = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Sign in");
    }
    const { targetUserId, role } = (data || {});
    if (!targetUserId || !role) {
        throw new functions.https.HttpsError("invalid-argument", "targetUserId and role are required");
    }
    const callerEmail = String(context.auth.token.email || "").toLowerCase();
    const callerRole = String(context.auth.token.role || "");
    if (role === "admin" && callerEmail !== ROOT) {
        throw new functions.https.HttpsError("permission-denied", "Only root admin can assign admin");
    }
    if (role === "coadmin" && !(callerRole === "admin" || callerEmail === ROOT)) {
        throw new functions.https.HttpsError("permission-denied", "Only admin can assign coadmin");
    }
    await (0, auth_1.getAuth)().setCustomUserClaims(targetUserId, { role });
    await (0, firestore_1.getFirestore)()
        .doc(`users/${targetUserId}`)
        .set({ role, updatedAt: Date.now() }, { merge: true });
    return { ok: true };
});
