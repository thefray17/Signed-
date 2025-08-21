import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onUserCreate } from "firebase-functions/v2/auth";
import { onCall, HttpsError } from "firebase-functions/v2/https";
initializeApp();
const ROOT_ADMIN_EMAIL = "eballeskaye@gmail.com";
export const onauthcreate = onUserCreate(async (event) => {
    const user = event.data;
    const auth = getAuth();
    const db = getFirestore();
    const baseUserDoc = {
        uid: user.uid,
        email: user.email ?? "",
        displayName: user.displayName ?? "",
        role: "user",
        status: "pending",
        onboardingComplete: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    if (user.email?.toLowerCase() === ROOT_ADMIN_EMAIL) {
        await auth.setCustomUserClaims(user.uid, { role: "admin" });
        await db.doc(`users/${user.uid}`).set({
            ...baseUserDoc,
            role: "admin",
            status: "approved",
            onboardingComplete: true,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    else {
        await db.doc(`users/${user.uid}`).set(baseUserDoc, { merge: true });
    }
});
export const assignUserRole = onCall(async (req) => {
    if (!req.auth)
        throw new HttpsError("unauthenticated", "You must be signed in to perform this action.");
    const { targetUserId, role } = req.data || {};
    if (!targetUserId || !role) {
        throw new HttpsError("invalid-argument", "The function must be called with 'targetUserId' and 'role' arguments.");
    }
    const callerEmail = String(req.auth.token.email || "").toLowerCase();
    const callerRole = String(req.auth.token.role || "");
    if (role === "admin" && callerEmail !== ROOT_ADMIN_EMAIL) {
        throw new HttpsError("permission-denied", "Only the root administrator can assign other admins.");
    }
    if (role === "co-admin" && !(callerRole === "admin" || callerEmail === ROOT_ADMIN_EMAIL)) {
        throw new HttpsError("permission-denied", "Only an admin can assign co-admins.");
    }
    try {
        await getAuth().setCustomUserClaims(targetUserId, { role });
        await getFirestore().doc(`users/${targetUserId}`).update({
            role,
            updatedAt: FieldValue.serverTimestamp()
        });
        return { ok: true, message: `Successfully assigned role '${role}' to user.` };
    }
    catch (error) {
        console.error("Error assigning user role:", error);
        throw new HttpsError("internal", "An unexpected error occurred while assigning the user role.");
    }
});
