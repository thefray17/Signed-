
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminApp } from "@/lib/firebase-admin-app";

export const runtime = "nodejs"; // Admin SDK requires Node runtime

const ONE_DAY_IN_SECONDS = 24 * 60 * 60;
const TWO_WEEKS_IN_SECONDS = 14 * ONE_DAY_IN_SECONDS;

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

export async function POST(req: NextRequest) {
  try {
    const { idToken, remember } = (await req.json()) as {
      idToken?: string;
      remember?: boolean;
    };
    if (!idToken) return json(400, { error: "Missing idToken" });

    const auth = adminApp.auth();
    const expiresIn = (remember ? TWO_WEEKS_IN_SECONDS : ONE_DAY_IN_SECONDS) * 1000;

    // Verify ID token first to produce clear errors and read project.
    let decoded;
    try {
      decoded = await auth.verifyIdToken(idToken, true);
    } catch (e: any) {
      const code = e?.code || "auth/invalid-id-token";
      return json(401, { error: `Invalid ID token (${code})` });
    }

    // Cross-check project to avoid client/admin mismatch.
    const adminProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const tokenAud = (decoded as any)?.aud;
    if (adminProject && tokenAud && adminProject !== tokenAud) {
      return json(400, {
        error: `Token project mismatch: token.aud=${tokenAud} vs admin.projectId=${adminProject}`,
      });
    }
    const tokenIss = (decoded as any)?.iss; // e.g. https://securetoken.google.com/<projectId>
    if (adminProject && tokenIss && !String(tokenIss).endsWith("/" + adminProject)) {
      return json(400, {
        error: `Token issuer mismatch: iss=${tokenIss} vs admin.projectId=${adminProject}`,
      });
    }

    const isEmu = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

    // Create cookie value: session cookie in prod, raw ID token in emulator.
    let cookieValue: string;
    let maxAge = remember ? TWO_WEEKS_IN_SECONDS : ONE_DAY_IN_SECONDS;

    if (isEmu) {
      // Auth Emulator: be liberal—use ID token directly, verify later with verifyIdToken.
      cookieValue = idToken;
    } else {
      try {
        cookieValue = await auth.createSessionCookie(idToken, { expiresIn });
      } catch (e: any) {
        const code = e?.code || "auth/create-session-cookie-failed";
        return json(401, { error: `Invalid token (${code})` });
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
      maxAge: maxAge,
    });
    return res;
  } catch (e: any) {
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
