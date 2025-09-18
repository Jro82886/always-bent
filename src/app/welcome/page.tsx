'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Anchor, Loader2, ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const [captainName, setCaptainName] = useState('');
  const [boatName, setBoatName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captainName.trim() || !boatName.trim()) return;
    
    setLoading(true);
    
    // Save to localStorage
    const userId = `user-${Date.now()}`;
    localStorage.setItem('abfi_captain_name', captainName.trim());
    localStorage.setItem('abfi_boat_name', boatName.trim());
    localStorage.setItem('abfi_user_id', userId);
    localStorage.setItem('abfi_session_start', Date.now().toString());
    
    // Redirect to app
    setTimeout(() => {
      router.push('/legendary');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mb-4">
              <Anchor className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to ABFI
            </h1>
            <p className="text-cyan-400 text-lg">
              Always Bent Fishing Intelligence
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Captain Name
              </label>
              <input
                type="text"
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Boat Name
              </label>
              <input
                type="text"
                value={boatName}
                onChange={(e) => setBoatName(e.target.value)}
                placeholder="Enter your boat name"
                className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !captainName.trim() || !boatName.trim()}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Enter Platform
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>Beta Version 1.0</p>
            <p className="mt-1">No account needed - just enter your details</p>
          </div>
        </div>
      </div>
    </div>
  );
}