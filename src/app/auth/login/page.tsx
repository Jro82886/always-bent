'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Anchor, Ship, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  // Simple name-based entry - NO AUTH NEEDED!
  const [captainName, setCaptainName] = useState('');
  const [boatName, setBoatName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEnterPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Simple validation
    if (!captainName.trim() || !boatName.trim()) {
      setError('Please enter both Captain Name and Boat Name');
      return;
    }
    
    setLoading(true);

    // Create a unique session for this user
    const timestamp = Date.now();
    const userId = `${captainName.replace(/\s+/g, '_')}_${timestamp}`;
    
    // Save to localStorage for the session
    localStorage.setItem('abfi_captain_name', captainName.trim());
    localStorage.setItem('abfi_boat_name', boatName.trim());
    localStorage.setItem('abfi_user_id', userId);
    localStorage.setItem('abfi_session_start', timestamp.toString());
    
    // Track this as a new session
    console.log(`New ABFI session: ${captainName} on ${boatName} (${userId})`);
    
    // Go straight to the app - no auth needed!
    setTimeout(() => {
      router.replace('/legendary?mode=analysis');
    }, 100);
  };
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Anchor className="w-12 h-12 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Welcome to ABFI
            </h1>
            <p className="text-slate-400 mt-2">Enter your captain and boat name</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Simple Name Entry Form - NO PASSWORD! */}
          <form onSubmit={handleEnterPlatform} className="space-y-6">
            <div>
              <label htmlFor="captain" className="block text-sm font-medium text-cyan-300 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Captain Name
              </label>
              <input
                type="text"
                id="captain"
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                placeholder="Captain Mike"
                className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="boat" className="block text-sm font-medium text-cyan-300 mb-2">
                <Ship className="inline w-4 h-4 mr-1" />
                Boat Name
              </label>
              <input
                type="text"
                id="boat"
                value={boatName}
                onChange={(e) => setBoatName(e.target.value)}
                placeholder="Reel Deal"
                className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg rounded-lg hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entering Platform...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Anchor className="w-5 h-5" />
                  Enter ABFI Platform
                </span>
              )}
            </button>
          </form>

          {/* Simple footer */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-center text-slate-500">
              Access provided through Always Bent membership
            </p>
            <p className="text-xs text-center text-slate-400 mt-2">
              Each captain gets their own unique session
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}