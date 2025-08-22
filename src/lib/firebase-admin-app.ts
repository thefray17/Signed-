import * as admin from "firebase-admin";

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  process.env.GCP_PROJECT ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

function getAdminApp(): admin.app.App {
  if (admin.apps.length && admin.apps[0]) return admin.apps[0];

  // Use ADC; projectId must be set for emulator & consistency.
  const app = admin.initializeApp({
    projectId: PROJECT_ID,
    credential: admin.credential.applicationDefault(),
  });

  // Optional Firestore emulator wiring (Auth emulator is env-only)
  if (process.env.FIREBASE_EMULATOR_HOST || process.env.FIREBASE_FIRESTORE_EMULATOR_HOST) {
    try {
      admin.firestore().settings({
        host:
          (process.env.FIREBASE_FIRESTORE_EMULATOR_HOST ??
            process.env.FIREBASE_EMULATOR_HOST ??
            "127.0.0.1:8080").replace(/^https?:\/\//, ""),
        ssl: false,
      });
    } catch {
      // ignore
    }
  }

  return app;
}

export const adminApp = getAdminApp();