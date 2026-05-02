import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "session";

function getSecretKey(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const protectedPrefixes = ["/intake", "/parcel", "/entry", "/archive"];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (!isProtected) {
    return NextResponse.next();
  }

  const secret = getSecretKey();
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!secret || !token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    const res = NextResponse.redirect(login);
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
}

export const config = {
  matcher: [
    "/intake",
    "/parcel",
    "/entry",
    "/archive",
    "/intake/:path*",
    "/parcel/:path*",
    "/entry/:path*",
    "/archive/:path*",
  ],
};
