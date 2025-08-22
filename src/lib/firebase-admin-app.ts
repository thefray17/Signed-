import * as admin from "firebase-admin";

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  process.env.GCP_PROJECT ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID; // fallback

// Reuse existing app in dev to avoid re-init
function getAdminApp() {
  const existing = admin.apps?.[0];
  if (existing) return existing;

  // In emulator, credentials are ignored but projectId must be set.
  const options: admin.AppOptions = {
    projectId: PROJECT_ID,
    credential:
      process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG
        ? admin.credential.applicationDefault()
        : admin.credential.applicationDefault(),
  };

  return admin.initializeApp(options);
}

export const adminApp = getAdminApp();

// Optional: wire emulators if present (Auth emulator auto-detected via env var)
if (process.env.FIREBASE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  // Firestore emulator (optional)
  try {
    // @ts-expect-error setSettings exists at runtime
    admin.firestore().settings({
      host: process.env.FIREBASE_EMULATOR_HOST?.replace(/^https?:\/\//, "") || "127.0.0.1:8080",
      ssl: false,
    });
  } catch {}
}

export type { app as AdminAppType } from "firebase-admin";
