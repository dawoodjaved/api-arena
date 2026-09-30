import { handlers } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function withJsonError(
  fn: (req: NextRequest) => Promise<Response>,
  req: NextRequest
): Promise<Response> {
  try {
    return await fn(req);
  } catch (error) {
    console.error("[auth] route error:", error);
    return NextResponse.json(
      { error: "SessionError", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return withJsonError(handlers.GET, req);
}

export async function POST(req: NextRequest) {
  return withJsonError(handlers.POST, req);
}
