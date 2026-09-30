import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { apiId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const api = await prisma.aPI.findUnique({ where: { id: params.apiId } });
    if (!api) {
      return NextResponse.json({ error: "API not found" }, { status: 404 });
    }

    const isFeatured =
      typeof body.isFeatured === "boolean" ? body.isFeatured : !api.isFeatured;

    const updated = await prisma.aPI.update({
      where: { id: params.apiId },
      data: { isFeatured },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error toggling featured:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
