import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminApp } from "@/lib/firebase-admin-app";

export const runtime = "nodejs"; // Admin SDK requires Node

const ONE_DAY_IN_SECONDS = 24 * 60 * 60;
const TWO_WEEKS_IN_SECONDS = 14 * ONE_DAY_IN_SECONDS;

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}
function isJwt(t: unknown): t is string {
  return typeof t === "string" && /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(t);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { idToken?: unknown; remember?: boolean };
    const idToken = body?.idToken;
    const remember = !!body?.remember;

    if (!isJwt(idToken)) {
      return json(400, { error: "Missing/invalid idToken (must be JWT string)" });
    }

    const auth = adminApp.auth();
    const expiresIn = (remember ? TWO_WEEKS_IN_SECONDS : ONE_DAY_IN_SECONDS) * 1000;

    // Verify ID token first for precise error messages
    let decoded: any;
    try {
      decoded = await auth.verifyIdToken(idToken, true);
    } catch (e: any) {
      return json(401, { error: `Invalid ID token (${e?.code || "auth/invalid-id-token"})` });
    }

    // Detect project/issuer mismatches early
    const adminProject = adminApp.options.projectId;
    const tokenAud = decoded?.aud;
    const tokenIss = decoded?.iss;
    if (adminProject && tokenAud && adminProject !== tokenAud) {
      return json(400, { error: `Token project mismatch: token.aud=${tokenAud} vs admin.projectId=${adminProject}` });
    }
    if (adminProject && tokenIss && !String(tokenIss).endsWith("/" + adminProject)) {
      return json(400, { error: `Token issuer mismatch: iss=${tokenIss} vs admin.projectId=${adminProject}` });
    }

    // Emulator: don't create session cookie; reuse verified ID token
    const isEmu = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

    let cookieValue: string;
    let maxAge = remember ? TWO_WEEKS_IN_SECONDS : ONE_DAY_IN_SECONDS;

    if (isEmu) {
      cookieValue = idToken; // already verified above
    } else {
      try {
        cookieValue = await auth.createSessionCookie(idToken, { expiresIn });
      } catch (e: any) {
        return json(401, { error: `Invalid token (${e?.code || "auth/create-session-cookie-failed"})` });
      }
    }

    const res = new NextResponse(JSON.stringify({ status: "success" }), { status: 200 });
    res.cookies.set({
      name: "session",
      value: cookieValue,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge,
    });
    return res;
  } catch(e) {
    console.error("POST /api/auth/session failed:", e);
    return json(500, { error: "Server error creating session" });
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