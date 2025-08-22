
/**
 * Clean v2 setup (global options + HTTPS callables) + v1 auth trigger.
 * Region: asia-southeast1
 */
import { setGlobalOptions } from "firebase-functions/v2";
import { onCall, HttpsError } from "firebase-functions/v2/https";

// ⚠️ Explicit v1 import for auth trigger chain (.region().auth.user().onCreate())
import * as functionsV1 from "firebase-functions/v1";

import { initializeApp } from "firebase-admin/app";
import { getAuth, type UserRecord } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const functionInitializationTimestamp = new Date();
const globalOptions = {
  region: "asia-southeast1",
  memory: "256MiB" as const,
  timeoutSeconds: 60,
};
setGlobalOptions(globalOptions);

initializeApp();
const db = getFirestore();
const auth = getAuth();

const ROOT_EMAIL = "eballeskaye@gmail.com".toLowerCase();

/** Helper function to create an audit log entry */
const addAuditLog = async (
  actorUid: string,
  actorEmail: string,
  action: string,
  status: "success" | "failure",
  details: Record<string, any>
) => {
  try {
    await db.collection("auditLogs").add({
      actorUid,
      actorEmail,
      action,
      status,
      details,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to write to audit log:", error);
  }
};

/** v1 auth trigger (post-create), pinned to Singapore */
export const onAuthCreate = functionsV1
  .region("asia-southeast1")
  .auth.user()
  .onCreate(async (user: UserRecord) => {
    const email = (user.email ?? "").toLowerCase();

    const base = {
      email,
      displayName: user.displayName,
      role: "user" as const,
      status: "pending" as const,
      onboardingSteps: {
        profileCompleted: { status: false, timestamp: null },
        roleAssigned: { status: false, timestamp: null },
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.doc(`users/${user.uid}`).set(base, { merge: true });

    if (email === ROOT_EMAIL) {
      await auth.setCustomUserClaims(user.uid, { role: "admin", isRoot: true });
      await db.doc(`users/${user.uid}`).set(
        { 
          role: "admin", 
          status: "approved", 
          isRoot: true, 
          updatedAt: FieldValue.serverTimestamp(),
          "onboardingSteps.profileCompleted": { status: true, timestamp: FieldValue.serverTimestamp() },
          "onboardingSteps.roleAssigned": { status: true, timestamp: FieldValue.serverTimestamp() },
        },
        { merge: true }
      );
    }
  });

/** v2 callable: assign role */
export const assignUserRole = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in first.");

  const caller = request.auth;
  const callerIsRoot = caller.token.isRoot === true;
  const callerIsAdmin = caller.token.role === "admin" || callerIsRoot;
  const actor = { uid: caller.uid, email: caller.token.email || "unknown" };

  const { targetUserId, role } = (request.data || {}) as {
    targetUserId?: string;
    role?: "user" | "coadmin" | "admin";
  };

  const auditDetails: Record<string, any> = { targetUserId, requestedRole: role };

  try {
    if (!targetUserId || !role)
      throw new HttpsError("invalid-argument", "Provide targetUserId and role.");

    if (role === "admin" && !callerIsRoot)
      throw new HttpsError("permission-denied", "Only root can assign admin.");
    if ((role === "coadmin" || role === "user") && !callerIsAdmin)
      throw new HttpsError("permission-denied", "Only admin/root can assign this role.");
    
    const targetUserDoc = await db.doc(`users/${targetUserId}`).get();
    const oldRole = targetUserDoc.data()?.role || "user";
    auditDetails.oldRole = oldRole;

    await auth.setCustomUserClaims(targetUserId, { role });
    await db.doc(`users/${targetUserId}`).set(
      { 
        role, 
        "onboardingSteps.roleAssigned": { status: true, timestamp: FieldValue.serverTimestamp() },
        updatedAt: FieldValue.serverTimestamp() 
      },
      { merge: true }
    );

    await addAuditLog(actor.uid, actor.email, "assignUserRole", "success", auditDetails);
    return { ok: true };

  } catch (error: any) {
    auditDetails.error = error.message;
    await addAuditLog(actor.uid, actor.email, "assignUserRole", "failure", auditDetails);
    // Re-throw the error to the client
    throw error;
  }
});

/** v2 callable: update user status */
export const updateUserStatus = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Sign in first.");
  
    const caller = request.auth;
    const callerIsRoot = caller.token.isRoot === true;
    const callerIsAdmin = caller.token.role === "admin" || callerIsRoot;
    const actor = { uid: caller.uid, email: caller.token.email || "unknown" };
  
    const { targetUserId, status } = (request.data || {}) as {
      targetUserId?: string;
      status?: "pending" | "approved" | "rejected" | "disabled";
    };
  
    const auditDetails: Record<string, any> = { targetUserId, requestedStatus: status };
  
    try {
      if (!targetUserId || !status)
        throw new HttpsError("invalid-argument", "Provide targetUserId and status.");
  
      if (!callerIsAdmin)
        throw new HttpsError("permission-denied", "Only admins or co-admins can change user status.");
      
      const targetUserDoc = await db.doc(`users/${targetUserId}`).get();
      const oldStatus = targetUserDoc.data()?.status || "pending";
      auditDetails.oldStatus = oldStatus;
  
      await db.doc(`users/${targetUserId}`).set(
        { status, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
  
      await addAuditLog(actor.uid, actor.email, "updateUserStatus", "success", auditDetails);
      return { ok: true };
  
    } catch (error: any) {
      auditDetails.error = error.message;
      await addAuditLog(actor.uid, actor.email, "updateUserStatus", "failure", auditDetails);
      throw error;
    }
});

/** v2 callable: ensure root */
export const ensureRootClaims = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in first.");
  
  const email = String(request.auth.token.email || "").toLowerCase();
  const actor = { uid: request.auth.uid, email };
  
  if (email !== ROOT_EMAIL) throw new HttpsError("permission-denied", "Root only.");

  const uid = request.auth.uid;
  await auth.setCustomUserClaims(uid, { role: "admin", isRoot: true });
  await db.doc(`users/${uid}`).set(
    { 
      role: "admin", 
      isRoot: true, 
      status: "approved", 
      updatedAt: FieldValue.serverTimestamp(),
      "onboardingSteps.profileCompleted": { status: true, timestamp: FieldValue.serverTimestamp() },
      "onboardingSteps.roleAssigned": { status: true, timestamp: FieldValue.serverTimestamp() },
    },
    { merge: true }
  );

  await addAuditLog(actor.uid, actor.email, "ensureRootClaims", "success", { targetUserId: uid });

  return { ok: true };
});


/** v2 callable: get function health */
export const getFunctionHealth = onCall((request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in first.");

  const isRoot = request.auth.token.isRoot === true;
  const isAdmin = request.auth.token.role === "admin" || isRoot;

  if (!isAdmin) {
    throw new HttpsError("permission-denied", "You must be an admin to call this function.");
  }

  return {
    status: "ok",
    initializationTimestamp: functionInitializationTimestamp.toISOString(),
    region: globalOptions.region,
    memory: globalOptions.memory,
    runtime: process.version,
    versions: process.versions,
  };
});

    