import Link from "next/link";
import { Shield, TrendingUp, Globe, Zap, BarChart3, Users, CheckCircle2, ArrowRight, Play } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0E1A]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#151B2B] border border-[rgba(79,127,255,0.1)] rounded-full mb-6">
                <Shield className="w-4 h-4 text-[#4F7FFF]" />
                <span className="text-sm text-gray-300">Secure and Scalable Infrastructure</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Powerful APIs, Scalable Infrastructure,{" "}
                <span className="bg-gradient-to-r from-[#6B92FF] to-[#8B5CF6] bg-clip-text text-transparent">
                  Seamless Integration
                </span>
              </h1>

              <p className="text-lg text-gray-400 mb-8 max-w-xl">
                Access scalable, secure, and ready-to-integrate APIs that accelerate your development process, reduce overhead, and enable faster time to market.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <Link
                  href="/auth/signup"
                  className="px-6 py-3 bg-[#4F7FFF] hover:bg-[#6B92FF] text-white rounded-lg font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,127,255,0.3)] flex items-center gap-2"
                >
                  Sign Up for Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="px-6 py-3 bg-[#151B2B] border border-[rgba(255,255,255,0.05)] text-white rounded-lg font-medium hover:border-[rgba(79,127,255,0.2)] transition-all flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              {/* Trusted Companies */}
              <div>
                <p className="text-sm text-gray-500 mb-4">Trusted by leading companies worldwide</p>
                <div className="flex items-center gap-8 opacity-60">
                  <div className="text-gray-400 font-semibold">Logoipsum</div>
                  <div className="text-gray-400 font-semibold">Logoipsum</div>
                  <div className="text-gray-400 font-semibold">Logo ipsum</div>
                </div>
              </div>
            </div>

            {/* Right Content - Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm text-gray-400 uppercase tracking-wider">Total API Requests</h3>
                  <BarChart3 className="w-5 h-5 text-[#4F7FFF]" />
                </div>
                <p className="text-4xl font-bold text-white mb-2">15.647</p>
                <p className="text-sm text-gray-400">Monitor incoming API traffic with accuracy</p>
                <div className="flex gap-2 mt-4">
                  <span className="px-2 py-1 text-xs bg-[#10B981]/20 text-[#10B981] rounded border border-[#10B981]/30">
                    Instant Integration
                  </span>
                  <span className="px-2 py-1 text-xs bg-[#4F7FFF]/20 text-[#4F7FFF] rounded border border-[#4F7FFF]/30">
                    Secure Access
                  </span>
                </div>
              </div>

              <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Visitors</h3>
                <p className="text-4xl font-bold text-white mb-4">40</p>
                <p className="text-sm text-gray-400 mb-4">countries</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">United Kingdom</span>
                    <span className="text-white font-semibold">2,890</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Indonesia</span>
                    <span className="text-white font-semibold">1,970</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Germany</span>
                    <span className="text-white font-semibold">1,970</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 backdrop-blur-xl col-span-2">
                <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-2">Your API Usage</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Easily monitor and analyze how much of your API quota has been consumed throughout the month, helping you stay on track, avoid overages, and make informed decisions based on real-time usage data.
                </p>
                <div className="h-32 bg-gradient-to-t from-[#4F7FFF]/20 to-transparent rounded-lg flex items-end justify-center">
                  <div className="w-full h-20 relative">
                    <svg className="w-full h-full" viewBox="0 0 200 80">
                      <path
                        d="M 0 60 Q 25 50, 50 45 T 100 40 T 150 35 T 200 30"
                        stroke="#4F7FFF"
                        strokeWidth="3"
                        fill="none"
                        className="drop-shadow-[0_0_8px_rgba(79,127,255,0.4)]"
                      />
                      <circle cx="200" cy="30" r="4" fill="#60A5FA" stroke="#4F7FFF" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#111827]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#151B2B] border border-[rgba(79,127,255,0.1)] rounded-full mb-6">
              <Zap className="w-4 h-4 text-[#4F7FFF]" />
              <span className="text-sm text-gray-300">Features</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Powerful Features Built for{" "}
              <span className="bg-gradient-to-r from-[#6B92FF] to-[#8B5CF6] bg-clip-text text-transparent">
                Scalable Integration
              </span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Discover developer-focused features designed to streamline API workflows, enhance security, and boost performance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: BarChart3,
                title: "Live Request Monitoring",
                description: "View real-time API request activity and response status.",
              },
              {
                icon: TrendingUp,
                title: "Usage Quota Tracking",
                description: "View real-time API request and response status.",
              },
              {
                icon: Shield,
                title: "Error Rate Insights",
                description: "View real-time API request activity and response status.",
              },
              {
                icon: Globe,
                title: "Traffic by Region",
                description: "View real-time API request and response status.",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(79,127,255,0.15)] hover:border-[rgba(79,127,255,0.2)] transition-all"
                >
                  <div className="w-12 h-12 bg-[#4F7FFF]/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#4F7FFF]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "99.99%",
                label: "Uptime Guaranteed",
                description: "Your API stays online and responsive, always.",
              },
              {
                number: "+2,500",
                label: "Developers Onboard",
                description: "Trusted by a growing global developer community.",
              },
              {
                number: "100M+",
                label: "API Requests Served Monthly",
                description: "Proven scalability for products of any size.",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 text-center"
              >
                <p className="text-5xl font-bold text-white mb-2">{stat.number}</p>
                <h3 className="text-lg font-semibold text-white mb-2">{stat.label}</h3>
                <p className="text-gray-400">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#111827]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of developers building with our powerful API platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-[#4F7FFF] hover:bg-[#6B92FF] text-white rounded-lg font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,127,255,0.3)] flex items-center gap-2"
            >
              Sign Up for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/marketplace"
              className="px-8 py-4 bg-transparent border border-[#4F7FFF] text-[#4F7FFF] hover:bg-[#4F7FFF] hover:text-white rounded-lg font-medium transition-all"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
