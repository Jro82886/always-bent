'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    // Check URL for confirmation result
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      setStatus('error');
      setMessage(errorDescription || 'Email confirmation failed');
    } else {
      setStatus('success');
      setMessage('Your email has been confirmed successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    }
  }, [router]);
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)] max-w-md w-full">
        
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-white mb-2">Confirming your email...</h2>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">Email Confirmed!</h2>
            <p className="text-slate-400 mb-6">{message}</p>
            <p className="text-cyan-400">Redirecting to login...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-400 mb-2">Confirmation Failed</h2>
            <p className="text-slate-400 mb-6">{message}</p>
            <div className="space-y-3">
              <Link 
                href="/auth/signup"
                className="block w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all text-center"
              >
                Try Signing Up Again
              </Link>
              <Link 
                href="/auth/login"
                className="block text-cyan-400 hover:text-cyan-300 transition-colors text-center"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
