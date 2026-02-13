// middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // daftar route publik
  const publicPaths = ["/login", "/", "/api", "/_next", "/favicon.ico"];
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  // ambil cookie auth-token
  const cookieToken = request.cookies.get("auth-token")?.value;

  // jika route PRIVATE tapi tidak ada cookie -> redirect ke login
  if (!isPublicPath && !cookieToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // jika sudah login tapi akses /login -> redirect ke dashboard
  if (pathname === "/login" && cookieToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",  // 🔥 HANYA DASHBOARD YANG DIPROTEKSI!
    "/schedule/:path*",   // 🔥 KALO MASIH PAKE /schedule
    "/officers/:path*",   // 🔥 DAN HALAMAN LAIN YANG BUTUH LOGIN
  ]
};