import { initializeApp, getApps, cert, applicationDefault, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  process.env.GCP_PROJECT ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  undefined;

const USING_AUTH_EMULATOR = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const USING_FS_EMULATOR =
  !!process.env.FIREBASE_FIRESTORE_EMULATOR_HOST || !!process.env.FIREBASE_EMULATOR_HOST;

/** Build a service-account credential from env if available. */
function buildServiceAccountCredential() {
  const pk = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const pid = PROJECT_ID;
  if (pk && email && pid) {
    // Fix common newline escaping when stored in .env
    const privateKey = pk.replace(/\\n/g, "\n");
    return cert({ privateKey, clientEmail: email, projectId: pid });
  }
  return null;
}

let app: App;

if (getApps().length) {
  app = getApps()[0]!;
} else {
  // Init rules:
  // - Emulator: no credentials required; just set projectId.
  // - Prod: prefer explicit service account via env; else fallback to ADC.
  if (USING_AUTH_EMULATOR || USING_FS_EMULATOR) {
    app = initializeApp({ projectId: PROJECT_ID });
  } else {
    const svc = buildServiceAccountCredential();
    if (svc) {
      app = initializeApp({ credential: svc, projectId: PROJECT_ID });
    } else {
      // Last resort: Application Default Credentials (Cloud env / local gcloud)
      app = initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
    }
  }
}

// Lazy singletons
let _auth: Auth | undefined;
let _db: Firestore | undefined;

/** Admin Auth accessor (singleton). */
export function adminAuth(): Auth {
  _auth ||= getAuth(app);
  return _auth!;
}

/** Admin Firestore accessor (singleton). */
export function adminDb(): Firestore {
  _db ||= getFirestore(app);
  // Firestore emulator is picked up automatically from FIREBASE_FIRESTORE_EMULATOR_HOST.
  return _db!;
}

/** Expose project id for diagnostics. */
export const adminProjectId: string | undefined = PROJECT_ID;
