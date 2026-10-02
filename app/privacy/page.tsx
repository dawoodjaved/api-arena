import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Endpointly",
  description: "Privacy Policy for Endpointly API Marketplace & Management Platform",
};

export default function PrivacyPage() {
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

        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString("en-US")}</p>

        <div className="prose prose-invert prose-gray max-w-none space-y-6 text-gray-400 text-sm sm:text-base">
          <p>
            Endpointly (“we,” “us,” or “our”) is committed to protecting your privacy. This Privacy Policy describes how we collect, use, and disclose information when you use our API marketplace and related services.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">Information We Collect</h2>
          <p>
            We collect information you provide when you register, sign in, publish or consume APIs, and contact support. This may include name, email address, account credentials, API usage data, and payment-related information where applicable. We also collect certain technical and usage data (such as IP address, browser type, and usage patterns) to operate and improve the service.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">How We Use Your Information</h2>
          <p>
            We use your information to provide, secure, and improve Endpointly; to communicate with you about your account and the service; to enforce our Terms of Service; and to comply with legal obligations. We may use aggregated or anonymized data for analytics and product improvement.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">Sharing and Disclosure</h2>
          <p>
            We do not sell your personal information. We may share information with service providers that help us operate the platform (e.g., hosting, payments), with API providers or consumers as needed to fulfill the service, or when required by law or to protect our rights and safety.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">Security and Retention</h2>
          <p>
            We use reasonable technical and organizational measures to protect your information. We retain your data for as long as your account is active or as needed to provide the service and fulfill the purposes described in this policy, unless a longer retention period is required by law.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">Contact</h2>
          <p>
            For privacy-related questions or requests, please contact us through the support or contact options provided in the Endpointly platform.
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
