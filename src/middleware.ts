import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get("auth_token")?.value;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAuthApi = pathname.startsWith("/api/auth");

  // not signed in -> redirect to /login (preserve intended URL)
  if (!token && !isAuthPage && !isAuthApi) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  // signed in -> keep out of /login and /register
  if (token && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Match everything except static assets & the Next image optimizer
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg)).*)",
  ],
};
