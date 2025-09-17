'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Anchor, Ship, User } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsProfile, setNeedsProfile] = useState(false);
  const [captainName, setCaptainName] = useState('');
  const [boatName, setBoatName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if user is already logged in
    checkUser();
    
    // Listen for auth state changes (when coming back from OAuth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check if user has profile info
        const { data: profile } = await supabase
          .from('profiles')
          .select('captain_name, boat_name')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.captain_name && profile?.boat_name) {
          // Profile complete, go to app
          localStorage.setItem('abfi_captain_name', profile.captain_name);
          localStorage.setItem('abfi_boat_name', profile.boat_name);
          router.replace('/legendary?mode=analysis');
        } else {
          // Need to collect captain/boat info
          setUserId(session.user.id);
          setNeedsProfile(true);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [router]);
  
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check if they have profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('captain_name, boat_name')
        .eq('id', user.id)
        .single();
      
      if (profile?.captain_name && profile?.boat_name) {
        // Already logged in with complete profile
        localStorage.setItem('abfi_captain_name', profile.captain_name);
        localStorage.setItem('abfi_boat_name', profile.boat_name);
        router.replace('/legendary?mode=analysis');
      } else {
        // Logged in but needs profile
        setUserId(user.id);
        setNeedsProfile(true);
      }
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: provider === 'google' ? 'email profile' : undefined
        }
      });
      
      if (error) throw error;
      
      // The redirect will happen automatically
    } catch (error: any) {
      console.error('Social login error:', error);
      setError(`Login failed: ${error.message || 'Please try again'}`);
      setLoading(false);
    }
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captainName.trim() || !boatName.trim()) {
      setError('Please enter both Captain Name and Boat Name');
      return;
    }
    
    if (!userId) {
      setError('User session not found. Please log in again.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Save or update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          captain_name: captainName.trim(),
          boat_name: boatName.trim(),
          updated_at: new Date().toISOString()
        });
      
      if (profileError) throw profileError;
      
      // Save to localStorage
      localStorage.setItem('abfi_captain_name', captainName.trim());
      localStorage.setItem('abfi_boat_name', boatName.trim());
      
      // Go to app
      router.replace('/legendary?mode=analysis');
    } catch (error: any) {
      console.error('Profile error:', error);
      setError('Failed to save profile. Please try again.');
      setLoading(false);
    }
  };
  
  // If user needs to complete profile
  if (needsProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
            
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Anchor className="w-12 h-12 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Complete Your Profile
              </h1>
              <p className="text-slate-400 mt-2">Tell us about your vessel</p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-6">
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
                    Saving Profile...
                  </span>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
  
  // Main login screen with social auth
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
            <p className="text-slate-400 mt-2">Sign in to access the platform</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="w-full py-4 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <button
              onClick={() => handleSocialLogin('facebook')}
              disabled={loading}
              className="w-full py-4 bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold rounded-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-slate-700"></div>
            <span className="px-4 text-slate-500 text-sm">Secure login</span>
            <div className="flex-1 border-t border-slate-700"></div>
          </div>

          {/* Info */}
          <div className="text-center">
            <p className="text-xs text-slate-500">
              By signing in, you agree to our Terms of Service
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Access provided through Always Bent membership
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-center text-slate-500">
              Your data is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}