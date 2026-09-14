import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/verification",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;

  // 1. Redirect /register to /login (no self-registration allowed)
  if (pathname === "/register" || pathname.startsWith("/register/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Root route handling
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // 3. Logged in users visiting auth routes should go to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 4. Non-authenticated users visiting protected pages should go to login
  if (!isAuthRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, files with extensions (.svg, .png, .jpg, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
