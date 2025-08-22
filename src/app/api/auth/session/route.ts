
import { NextResponse, type NextRequest } from "next/server";
import { adminApp } from "@/lib/firebase-admin-app";

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

    const decodedIdToken = await auth.verifyIdToken(idToken);
    
    // Only process if the user just signed in in the last 5 minutes.
    if (new Date().getTime() / 1000 - decodedIdToken.auth_time > 5 * 60) {
      return new NextResponse("Recent sign-in required.", { status: 401 });
    }

    // Create session cookie from ID token
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

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
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
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
