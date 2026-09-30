import { auth } from "./auth";

/** NextAuth v5-compatible session helper (replaces getServerSession). */
export async function getServerSession(_authOptions?: unknown) {
  return auth();
}

export async function getSession() {
  return auth();
}
