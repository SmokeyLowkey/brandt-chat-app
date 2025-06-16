import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Exclude public routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/change-password" ||
    pathname.startsWith("/api/users") // Allow access to password change API
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const token = await getToken({ req: request, secret: process.env.JWT_SECRET });
  
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // Check for password change cookie
  const passwordChanged = request.cookies.get("password_changed");
  
  // Check if user needs to change password
  // Skip the redirect in these cases:
  // 1. Already on the change-password page
  // 2. Coming from a password change (either via query param or cookie)
  // 3. Has the password_changed cookie set
  const fromPasswordChange = request.nextUrl.searchParams.get("from") === "password-change" ||
                           request.nextUrl.searchParams.get("from") === "password-change-error";
  
  if (token.mustChangePassword &&
      !passwordChanged &&
      pathname !== "/change-password" &&
      !fromPasswordChange) {
    const url = new URL("/change-password", request.url);
    return NextResponse.redirect(url);
  }

  // For dashboard routes, ensure user has access to the tenant
  if (pathname.startsWith("/dashboard")) {
    // Additional tenant-specific checks could be added here
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};