
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Why: early redirect to login if hitting /dashboard without a session cookie */
export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  // Let the auth API routes and auth pages through
  if (pathname.startsWith("/api/auth") || pathname === "/login" || pathname === "/signup") {
      return NextResponse.next();
  }

  // For all other protected routes, check for a session
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/rootadmin")) {
    const hasSession = req.cookies.has("session");
    if (!hasSession) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = { 
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - / (the root page, which is public)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/auth|login|signup|$).*)',
    ]
};
