"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="h-20 bg-[rgba(10,14,26,0.8)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.05)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-[#4F7FFF] to-[#8B5CF6] bg-clip-text text-transparent">
              APIArena
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/marketplace"
              className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Marketplace
            </Link>
            {session && (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/api-publisher/new"
                  className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Publish API
                </Link>
                {(session.user as any)?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
            {session ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-2 bg-transparent text-gray-400 border border-[rgba(255,255,255,0.05)] rounded-lg hover:bg-[#151B2B] hover:text-white hover:border-[rgba(79,127,255,0.1)] transition-all"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 bg-[#4F7FFF] hover:bg-[#6B92FF] text-white rounded-lg font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,127,255,0.3)]"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-transparent border border-[rgba(255,255,255,0.05)] text-gray-300 rounded-lg font-medium hover:bg-[#151B2B] hover:border-[rgba(79,127,255,0.1)] transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-[rgba(255,255,255,0.05)] mt-4">
            <Link
              href="/marketplace"
              className="block text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Marketplace
            </Link>
            {session && (
              <>
                <Link
                  href="/dashboard"
                  className="block text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/api-publisher/new"
                  className="block text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Publish API
                </Link>
                {(session.user as any)?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="block text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
            {session ? (
              <button
                onClick={() => {
                  signOut({ callbackUrl: "/" });
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 bg-transparent text-gray-400 border border-[rgba(255,255,255,0.05)] rounded-lg hover:bg-[#151B2B] hover:text-white hover:border-[rgba(79,127,255,0.1)] transition-all"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-4 py-2 bg-[#4F7FFF] hover:bg-[#6B92FF] text-white rounded-lg font-medium transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-4 py-2 bg-transparent border border-[rgba(255,255,255,0.05)] text-gray-300 rounded-lg font-medium hover:bg-[#151B2B] hover:border-[rgba(79,127,255,0.1)] transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
