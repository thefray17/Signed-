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
function decodePayload(jwt: string) {
  try {
    const [, payload] = jwt.split(".");
    const s = payload.replace(/-/g, "+").replace(/_/g, "/");
    const buf = Buffer.from(s + "===".slice((s.length + 3) % 4), "base64");
    return JSON.parse(buf.toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
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

    // Decode for diagnostics (aud/iss, token len)
    const decodedPayload = decodePayload(idToken) || {};
    const tokenAud = (decodedPayload as any)?.aud;
    const tokenIss = (decodedPayload as any)?.iss;
    // eslint-disable-next-line no-console
    console.info("[session] recv token:", {
      len: idToken.length,
      aud: tokenAud,
      iss: tokenIss,
      adminProjectId: adminProjectId,
      emu: !!process.env.FIREBASE_AUTH_EMULATOR_HOST,
    });

    // Verify token (Admin must target same project/emulator)
    let decoded: any;
    try {
      decoded = await auth.verifyIdToken(idToken, true);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("[session] verifyIdToken error:", e?.code || e?.message || e);
      // Useful hint if using emulator on client but not on server
      if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" && !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        return json(401, { error: "Invalid ID token: Auth Emulator not enabled on server (set FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099)" });
      }
      return json(401, { error: `Invalid ID token (${e?.code || "auth/invalid-id-token"})` });
    }

    // Cross-check project/issuer to catch mismatches early
    if (adminProjectId && tokenAud && adminProjectId !== tokenAud) {
      return json(400, { error: `Token project mismatch: token.aud=${tokenAud} vs admin.projectId=${adminProjectId}` });
    }
    if (adminProjectId && tokenIss && !String(tokenIss).endsWith("/" + adminProjectId)) {
      return json(400, { error: `Token issuer mismatch: iss=${tokenIss} vs admin.projectId=${adminProjectId}` });
    }

    const isEmu = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

    // Create cookie value: real session cookie in prod, reuse ID token in emulator
    let cookieValue: string;
    const maxAge = Math.floor(expiresIn / 1000);

    if (isEmu) {
      cookieValue = (idToken as string); // already verified with verifyIdToken() above
    } else {
      try {
        cookieValue = await auth.createSessionCookie(idToken as string, { expiresIn });
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error("[session] createSessionCookie error:", e?.code || e?.message || e);
        return json(401, { error: `Invalid token (${e?.code || "auth/create-session-cookie-failed"})` });
      }
    }

    const res = new NextResponse(null, { status: 204 });
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
  } catch (e) {
    // eslint-disable-next-line no-console
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
