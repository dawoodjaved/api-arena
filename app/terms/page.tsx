import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | APIDoorway",
  description: "Terms of Service for APIDoorway API Marketplace & Management Platform",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString("en-US")}</p>

        <div className="prose prose-invert prose-gray max-w-none space-y-6 text-gray-400 text-sm sm:text-base">
          <p>
            These Terms of Service (“Terms”) govern your access to and use of APIDoorway (“we,” “us,” or “our”), including our website, API marketplace, and related services. By signing in or using APIDoorway, you agree to these Terms.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">Use of the Service</h2>
          <p>
            You may use APIDoorway to discover, integrate, and manage APIs. You are responsible for keeping your account credentials secure and for all activity under your account. You must use the service in compliance with applicable laws and must not misuse, abuse, or attempt to compromise the security or availability of the platform or third‑party APIs.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">API Providers and Consumers</h2>
          <p>
            If you publish APIs on APIDoorway, you are responsible for the accuracy of your listings and for complying with any agreements you have with API consumers. If you consume APIs through APIDoorway, your use of those APIs is also subject to the terms set by the respective API providers.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">Changes and Termination</h2>
          <p>
            We may update these Terms from time to time. Continued use of APIDoorway after changes constitutes acceptance of the updated Terms. We may suspend or terminate access for violation of these Terms or for other operational or legal reasons.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">Contact</h2>
          <p>
            For questions about these Terms, please contact us through the support or contact options provided in the APIDoorway platform.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-[rgba(255,255,255,0.08)]">
          <Link
            href="/auth/signin"
            className="text-[#4F7FFF] hover:text-[#6B92FF] text-sm font-medium"
          >
            Return to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
