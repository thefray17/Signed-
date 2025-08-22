
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Why: early redirect to login if hitting /dashboard without a session cookie */
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    const hasSession = req.cookies.get("__session") || req.cookies.get("session");
    if (!hasSession) {
      const login = new URL("/login", req.url);
      login.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(login);
    }
  }
  return NextResponse.next();
}
export const config = { matcher: ["/dashboard/:path*"] };
