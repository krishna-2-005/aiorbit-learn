import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { safeNext } from "@/lib/safe-redirect";

const { auth } = NextAuth(authConfig);

const AUTH_PAGES = ["/login", "/signup"];

// Library and submit render their own sign-in prompt, so only auth pages redirect here.
export default auth((request) => {
  const { pathname } = request.nextUrl;
  if (request.auth?.user && AUTH_PAGES.includes(pathname)) {
    const next = safeNext(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, request.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  // Node runtime: Auth.js's JWT code uses APIs the Edge checker flags.
  runtime: "nodejs",
  matcher: ["/login", "/signup"],
};
