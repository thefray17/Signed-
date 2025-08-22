
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const publicPaths = ['/login', '/signup', '/'];
  const pathname = req.nextUrl.pathname;

  // Allow public paths
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.endsWith('.ico')) {
      return NextResponse.next();
  }
  
  // For all other paths, check for a session
  const hasSession = req.cookies.get("session") || req.cookies.get("__session");
  if (!hasSession) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
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
    '/((?!_next/static|_next/image|favicon.ico|$).*)',
  ]
};
