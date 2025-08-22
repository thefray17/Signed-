
import { NextResponse, type NextRequest } from "next/server";
import { adminApp } from "@/lib/firebase-admin-app";

export const runtime = 'nodejs';

const ONE_DAY_IN_SECONDS = 24 * 60 * 60;
const TWO_WEEKS_IN_SECONDS = 14 * ONE_DAY_IN_SECONDS;

export async function POST(req: NextRequest) {
  try {
    const { idToken, remember } = (await req.json()) as { idToken?: string; remember?: boolean };
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const auth = adminApp.auth();
    const expiresIn = (remember ? TWO_WEEKS_IN_SECONDS : ONE_DAY_IN_SECONDS) * 1000;
    
    // For local development with the emulator, we can't create a session cookie.
    // Instead, we'll use the ID token directly.
    const isEmulator = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
    
    let sessionCookie: string;

    if (isEmulator) {
        // In emulator mode, the ID token itself acts as the session "cookie"
        sessionCookie = idToken;
    } else {
        // In production, create a real session cookie.
        // This verifies the token and mints a new cookie.
        const decodedIdToken = await auth.verifyIdToken(idToken, true);

        // Make sure the token is from the same project
        if (decodedIdToken.aud !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
            return NextResponse.json({ error: "Token is for the wrong project" }, { status: 401 });
        }
        
        sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    }


    // Cookie options
    const res = new NextResponse(JSON.stringify({ status: "success" }), { status: 200 });
    res.cookies.set({
      name: "session",
      value: sessionCookie,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: remember ? TWO_WEEKS_IN_SECONDS : ONE_DAY_IN_SECONDS,
    });

    return res;
  } catch (e) {
    console.error("POST /api/auth/session failed:", e);
    const errorMessage = (e instanceof Error) ? e.message : 'Invalid token';
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }
}

export async function DELETE() {
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set({
    name: "session",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  return res;
}
