'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Anchor, Loader2, CheckCircle, Ship } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get email from Squarespace redirect (passed as query param)
  const emailFromSquarespace = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailFromSquarespace);
  const [captainName, setCaptainName] = useState('');
  const [boatName, setBoatName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existingUser, setExistingUser] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Check if this Squarespace user already has ABFI account
    checkExistingAccount();
  }, []);
  
  const checkExistingAccount = async () => {
    // First check localStorage for quick return users
    const savedEmail = localStorage.getItem('abfi_email');
    const savedCaptain = localStorage.getItem('abfi_captain_name');
    const savedBoat = localStorage.getItem('abfi_boat_name');
    
    if (savedEmail && savedCaptain && savedBoat) {
      // They've been here before - straight to the app!
      router.push('/legendary?mode=analysis');
      return;
    }
    
    // Check if email exists in Supabase (if we have email from Squarespace)
    if (emailFromSquarespace) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailFromSquarespace)
          .single();
          
        if (data) {
          // Existing user - save to localStorage and go to app
          localStorage.setItem('abfi_email', data.email);
          localStorage.setItem('abfi_captain_name', data.captain_name);
          localStorage.setItem('abfi_boat_name', data.boat_name);
          router.push('/legendary?mode=analysis');
          return;
        }
      } catch (e) {
        // No existing account, show setup
      }
    }
    
    setChecking(false);
  };
  
  const handleQuickSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Super simple - just save their info and let them in
    try {
      // Create a simple password from their boat name (they won't need to remember it)
      const simplePassword = `${boatName.replace(/\s+/g, '')}2024!`;
      
      // Try to create account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: simplePassword,
        options: {
          data: {
            captain_name: captainName,
            boat_name: boatName,
            from_squarespace: true
          }
        }
      });
      
      if (authError && authError.message.includes('already registered')) {
        // Account exists - try to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: simplePassword
        });
        
        if (signInError) {
          // Wrong password - they must have set it up differently before
          setExistingUser(true);
          setLoading(false);
          return;
        }
      }
      
      // Save to localStorage for next time
      localStorage.setItem('abfi_email', email);
      localStorage.setItem('abfi_captain_name', captainName);
      localStorage.setItem('abfi_boat_name', boatName);
      
      // Success - go to app!
      router.push('/legendary?mode=analysis');
      
    } catch (error) {
      setError('Something went wrong. Try again or use the demo.');
      setLoading(false);
    }
  };
  
  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-cyan-400">Checking your Always Bent account...</p>
        </div>
      </div>
    );
  }
  
  if (existingUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-10 max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white text-center mb-4">
            Account Already Exists!
          </h2>
          <p className="text-slate-400 text-center mb-6">
            You've already set up ABFI with this email. 
            Click below to sign in with your existing account.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 flex items-center justify-center px-4">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-10 shadow-[0_20px_70px_rgba(6,182,212,0.3)]">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 mb-4">
              <Anchor className="w-10 h-10 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to ABFI
            </h1>
            <p className="text-slate-400">
              Quick setup for Always Bent members
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {/* Quick Setup Form */}
          <form onSubmit={handleQuickSetup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Captain Name
              </label>
              <input
                type="text"
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                placeholder="Captain Mike"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                required
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Boat Name
              </label>
              <input
                type="text"
                value={boatName}
                onChange={(e) => setBoatName(e.target.value)}
                placeholder="Reel Deal"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email (from Always Bent)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="captain@alwaysbent.com"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                required
              />
              {emailFromSquarespace && (
                <p className="text-xs text-cyan-400 mt-1">Auto-filled from Always Bent</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Ship className="w-5 h-5" />
                  Start Using ABFI
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-400 mb-3">
              Already have an ABFI account?
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Sign In Instead
            </button>
          </div>
          
          {/* Skip for demo */}
          <div className="mt-4 text-center">
            <button
              onClick={async () => {
                setLoading(true);
                const { error } = await supabase.auth.signInWithPassword({
                  email: 'demo@alwaysbent.com',
                  password: 'demo123456'
                });
                if (!error) {
                  router.push('/legendary?mode=analysis');
                }
              }}
              className="text-sm text-slate-500 hover:text-green-400 transition-colors"
            >
              or try demo mode →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  );
}
