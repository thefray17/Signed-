
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/admin") || req.nextUrl.pathname.startsWith("/rootadmin")) {
    const hasSession = req.cookies.get("session") || req.cookies.get("__session");
    if (!hasSession) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
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
     * - /login, /signup (auth pages)
     * - /api (api routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|login|signup|api|$).*)',
  ]
};
