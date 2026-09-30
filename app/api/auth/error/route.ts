import { NextRequest, NextResponse } from "next/server";

/**
 * If a request hits /api/auth/error (e.g. old link or redirect), send the user
 * to the sign-in page with the error param so they see the message in context.
 */
export function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error") || "Default";
  const url = new URL("/auth/signin", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export function POST(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error") || "Default";
  const url = new URL("/auth/signin", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}
