'use client';

import Link from 'next/link';
import { Fish, MapPin, Users, TrendingUp, Waves, Thermometer } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <Fish size={32} className="text-cyan-400" />
          <span className="text-2xl font-bold text-white">Always Bent</span>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/auth/login" 
            className="px-4 py-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/auth/register" 
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 md:px-12 py-20 md:py-32 max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Fishing Intelligence
            <span className="block text-cyan-400">Powered by Ocean Data</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Real-time SST, chlorophyll mapping, and vessel tracking. 
            Find fish faster with data-driven insights.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/auth/register')}
              className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg shadow-cyan-600/25"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-lg transition-all border border-slate-700"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 md:px-12 py-20 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Everything You Need to Find Fish
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Thermometer className="text-orange-400" />}
            title="SST Mapping"
            description="Real-time sea surface temperature data to identify thermal breaks and edges"
          />
          <FeatureCard
            icon={<Waves className="text-green-400" />}
            title="Chlorophyll Analysis"
            description="Track plankton blooms and baitfish concentrations with satellite data"
          />
          <FeatureCard
            icon={<MapPin className="text-cyan-400" />}
            title="Vessel Tracking"
            description="See where the fleet is fishing and track your favorite boats"
          />
          <FeatureCard
            icon={<TrendingUp className="text-purple-400" />}
            title="Bite Reports"
            description="Community-driven catch reports and real-time bite tracking"
          />
          <FeatureCard
            icon={<Users className="text-blue-400" />}
            title="Fleet Intel"
            description="Share reports with your network while keeping spots secret"
          />
          <FeatureCard
            icon={<Fish className="text-pink-400" />}
            title="AI Predictions"
            description="Machine learning models predict optimal fishing conditions"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-12 py-20 max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-2xl p-12 border border-cyan-500/30">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Level Up Your Fishing?
          </h2>
          <p className="text-gray-400 mb-8">
            Join hundreds of captains using data to find more fish.
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg text-lg transition-all transform hover:scale-105"
          >
            Start Your Free Trial
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • 14-day free trial
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Fish size={24} className="text-cyan-400" />
            <span className="text-white font-medium">Always Bent Fishing Intelligence</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2024 ABFI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-cyan-500/50 transition-all">
      <div className="w-12 h-12 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}