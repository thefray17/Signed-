"use client";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app, "asia-southeast1");
const auth = getAuth(app);

// Persistence helps avoid flicker/loops after reloads.
setPersistence(auth, browserLocalPersistence).catch(() => { /* non-fatal */ });

// Enable emulator on client when flagged
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  try {
    const host = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
    // connectFirestoreEmulator(db, '127.0.0.1', 8080) // Example for Firestore
    connectAuthEmulator(auth, `http://${host}`, {
      disableWarnings: true,
    });
  } catch (error) {
    // ignore if connected twice
    // console.log("Emulator connection error", error)
  }
}

export { app, db, functions, auth };
