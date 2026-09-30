import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    errorFormat: "pretty",
  });

prisma.$connect().catch((error) => {
  console.error("Prisma connection error:", error.message);
  if (process.env.NODE_ENV === "development") {
    console.error("\n⚠️  Database Connection Issue Detected!");
    console.error("Please check DATABASE_URL and that PostgreSQL is running.");
  }
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
