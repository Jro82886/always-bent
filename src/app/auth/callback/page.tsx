'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    handleAuthCallback();
  }, []);
  
  const handleAuthCallback = async () => {
    try {
      // Get the hash fragment from the URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      // Also check query params (for email confirmation)
      const queryParams = new URLSearchParams(window.location.search);
      const error = queryParams.get('error');
      const errorDescription = queryParams.get('error_description');
      
      if (error) {
        setStatus('error');
        setMessage(errorDescription || 'Authentication failed');
        return;
      }
      
      if (accessToken) {
        // We have a valid session
        setStatus('success');
        setMessage(type === 'signup' ? 'Email confirmed! Redirecting...' : 'Signed in! Redirecting...');
        
        // Get user info to save locally
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata) {
          localStorage.setItem('abfi_captain_name', user.user_metadata.captain_name || '');
          localStorage.setItem('abfi_boat_name', user.user_metadata.boat_name || '');
          localStorage.setItem('abfi_email', user.email || '');
        }
        
        // Redirect to app
        setTimeout(() => {
          router.replace('/legendary?mode=analysis');
        }, 1500);
      } else {
        // Try to exchange code for session (OAuth flow)
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(window.location.search);
        
        if (!sessionError) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          setTimeout(() => {
            router.replace('/legendary?mode=analysis');
          }, 1500);
        } else {
          setStatus('error');
          setMessage('Invalid or expired link');
        }
      }
    } catch (error) {
      console.error('Callback error:', error);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)] max-w-md w-full">
        
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-white mb-2">Authenticating...</h2>
            <p className="text-slate-400">Please wait while we confirm your account</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">Success!</h2>
            <p className="text-slate-300 mb-2">{message}</p>
            <p className="text-cyan-400 animate-pulse">Loading ABFI...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-400 mb-2">Authentication Failed</h2>
            <p className="text-slate-400 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/auth/signup')}
                className="block w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all text-center"
              >
                Try Signing Up Again
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="block w-full text-cyan-400 hover:text-cyan-300 transition-colors text-center py-2"
              >
                Go to Login
              </button>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
