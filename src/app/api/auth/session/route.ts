// ============================================================================
// File: src/app/api/auth/session/route.ts  (FULL REPLACEMENT)
// ============================================================================
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminAuth, adminProjectId } from "@/lib/firebase-admin-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ONE_DAY = 24 * 60 * 60 * 1000;
const TWO_WEEKS = 14 * ONE_DAY;

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

    const auth = adminAuth();
    const expiresIn = remember ? TWO_WEEKS : ONE_DAY;

    // Verify token first for precise diagnostics
    let decoded: any;
    try {
      decoded = await auth.verifyIdToken(idToken, true);
    } catch (e: any) {
      console.error("[session] verifyIdToken error:", e?.code || e?.message || e);
      if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" && !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        return json(401, { error: "Invalid ID token: Auth Emulator not enabled on server (set FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099)" });
      }
      return json(401, { error: `Invalid ID token (${e?.code || "auth/invalid-id-token"})` });
    }

    // Project/issuer sanity (helps catch mismatched envs)
    const tokenAud = decoded?.aud;
    const tokenIss = decoded?.iss;
    if (adminProjectId && tokenAud && adminProjectId !== tokenAud) {
      return json(400, { error: `Token project mismatch: token.aud=${tokenAud} vs admin.projectId=${adminProjectId}` });
    }
    if (adminProjectId && tokenIss && !String(tokenIss).endsWith("/" + adminProjectId)) {
      return json(400, { error: `Token issuer mismatch: iss=${tokenIss} vs admin.projectId=${adminProjectId}` });
    }

    const isEmu = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

    const res = new NextResponse(null, { status: 204 });
    if (isEmu) {
      // Emulator: cookie can be the raw, already-verified token
      res.cookies.set({
        name: "session",
        value: idToken as string,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: Math.floor(expiresIn / 1000),
      });
    } else {
      // Prod: create a real session cookie
      try {
        const cookie = await auth.createSessionCookie(idToken as string, { expiresIn });
        res.cookies.set({
          name: "session",
          value: cookie,
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
          maxAge: Math.floor(expiresIn / 1000),
        });
      } catch (e: any) {
        console.error("[session] createSessionCookie error:", e?.code || e?.message || e);
        return json(401, { error: `Invalid token (${e?.code || "auth/create-session-cookie-failed"})` });
      }
    }
    return res;
  } catch (e) {
    console.error("[session] unexpected error:", e);
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