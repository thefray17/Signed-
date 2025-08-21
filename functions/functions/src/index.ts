import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onUserCreate } from "firebase-functions/v2/auth";

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
      onboardingComplete: true, // Admins don't need onboarding
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    // For regular users, the signup form on the client already creates this doc.
    // This function can serve as a backup or for other user creation methods.
    // We use { merge: true } to avoid overwriting client-side data if it exists.
    await db.doc(`users/${user.uid}`).set(baseUserDoc, { merge: true });
  }
});
