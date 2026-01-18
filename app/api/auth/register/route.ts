import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Use transaction to ensure atomicity
    // This ensures both user and account are created together or not at all
    const result = await prisma.$transaction(async (tx) => {
      // Create user first
      const user = await tx.user.create({
        data: {
          name: validated.name,
          email: validated.email,
        },
      });

      // Then create account with credentials
      // Account has unique constraint on [provider, providerAccountId]
      // Using user.id as providerAccountId ensures uniqueness per user
      await tx.account.create({
        data: {
          userId: user.id,
          type: "credentials",
          provider: "credentials",
          providerAccountId: user.id, // Use user.id to ensure uniqueness
          access_token: hashedPassword, // Store password hash here
        },
      });

      return user;
    }, {
      timeout: 10000, // 10 second timeout
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: result.id,
          email: result.email,
          name: result.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation error", 
          details: error.issues.map((e: z.ZodIssue) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    // Log the full error for debugging
    console.error("Registration error:", error);
    
    // Handle Prisma-specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message: string };
      
      // Unique constraint violation
      if (prismaError.code === 'P2002') {
        const target = (prismaError as any).meta?.target;
        if (target && target.includes('email')) {
          return NextResponse.json(
            { error: "User with this email already exists" },
            { status: 400 }
          );
        }
        if (target && target.includes('providerAccountId')) {
          return NextResponse.json(
            { error: "Account already exists for this user" },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: "A record with this information already exists" },
          { status: 400 }
        );
      }
      
      // Database connection error
      if (prismaError.code === 'P1001' || prismaError.code === 'P1000') {
        return NextResponse.json(
          { 
            error: "Database connection failed",
            message: "Please check your database configuration and ensure the database server is running."
          },
          { status: 503 }
        );
      }

      // Transaction timeout
      if (prismaError.code === 'P1008') {
        return NextResponse.json(
          { error: "Operation timed out. Please try again." },
          { status: 504 }
        );
      }
    }

    // Return error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { 
        error: "Failed to create user",
        message: errorMessage,
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.stack : String(error)
        })
      },
      { status: 500 }
    );
  }
}
