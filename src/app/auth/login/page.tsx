'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Anchor, Ship, User, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  
  // Simple name-based entry - NO AUTH NEEDED!
  const [captainName, setCaptainName] = useState('');
  const [boatName, setBoatName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  
  useEffect(() => {
    // Check if user already has a session
    const existingCaptain = localStorage.getItem('abfi_captain_name');
    const existingBoat = localStorage.getItem('abfi_boat_name');
    
    // Only pre-fill if they have existing data (don't auto-redirect)
    if (existingCaptain && existingBoat) {
      setCaptainName(existingCaptain);
      setBoatName(existingBoat);
    }
  }, []);

  const handleEnterPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Simple validation
    if (!captainName.trim() || !boatName.trim()) {
      setError('Please enter both Captain Name and Boat Name');
      return;
    }
    
    setLoading(true);

    try {
      // Create anonymous Supabase user - NO EMAIL NEEDED!
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Save profile with captain and boat names
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            captain_name: captainName.trim(),
            boat_name: boatName.trim(),
            is_guest: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.error('Profile error:', profileError);
          // Continue anyway - profile might already exist
        }
        
        // Save to localStorage for quick access
        localStorage.setItem('abfi_captain_name', captainName.trim());
        localStorage.setItem('abfi_boat_name', boatName.trim());
        localStorage.setItem('abfi_user_id', authData.user.id);
        localStorage.setItem('abfi_session_start', Date.now().toString());
        
        console.log(`New ABFI session: ${captainName} on ${boatName}`);
        
        // Go to app!
        setTimeout(() => {
          router.replace('/legendary?mode=analysis');
        }, 100);
      }
    } catch (error) {
      console.error('Session error:', error);
      setError('Connection issue - please try again');
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      {/* Beta Banner - Thin bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 text-center z-50">
        <button
          onClick={() => setShowFeedback(!showFeedback)}
          className="flex items-center justify-center gap-2 mx-auto hover:opacity-80 transition-opacity"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-medium">Beta Feedback</span>
        </button>
      </div>
      
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
      
      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Beta Feedback</h3>
            <p className="text-gray-400 mb-4">
              This is a beta version. Please report any issues to the Always Bent team.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => window.open('mailto:support@alwaysbent.com', '_blank')}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
              >
                Email Support
              </button>
              <button
                onClick={() => setShowFeedback(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}