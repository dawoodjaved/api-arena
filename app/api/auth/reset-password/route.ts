import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(8),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = schema.parse(body);
    const redis = getRedis();
    const key = `password-reset:${hashToken(token)}`;
    const raw = await redis.get(key);

    if (!raw) {
      return NextResponse.json(
        { error: "Reset link is invalid or expired" },
        { status: 400 }
      );
    }

    let payload: { userId: string; email: string };
    try {
      payload = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Reset link is invalid or expired" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const account = await prisma.account.findFirst({
      where: { userId: payload.userId, provider: "credentials" },
    });

    if (!account) {
      return NextResponse.json(
        { error: "No password-based account found for this user" },
        { status: 400 }
      );
    }

    await prisma.account.update({
      where: { id: account.id },
      data: { access_token: hashed },
    });

    await redis.del(key);

    return NextResponse.json({ message: "Password updated. You can sign in now." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Unable to reset password" },
      { status: 500 }
    );
  }
}
