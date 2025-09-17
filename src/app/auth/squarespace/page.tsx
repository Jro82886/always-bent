'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2, CheckCircle, Anchor } from 'lucide-react';

export default function SquarespaceAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('authenticating');
  const [userInfo, setUserInfo] = useState<any>(null);
  
  useEffect(() => {
    handleSquarespaceAuth();
  }, []);
  
  const handleSquarespaceAuth = async () => {
    // Get params from Squarespace redirect
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const memberId = searchParams.get('member_id');
    const token = searchParams.get('token');
    
    // If we have Squarespace data, auto-create/login
    if (email) {
      setUserInfo({ email, name });
      
      try {
        // First try to sign in
        let { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: `abfi_${memberId || email}` // Auto-generated password based on member ID
        });
        
        if (signInError) {
          // Account doesn't exist, create it
          const { error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: `abfi_${memberId || email}`,
            options: {
              data: {
                captain_name: name || email.split('@')[0],
                boat_name: 'Always Bent Member',
                squarespace_member: true,
                member_id: memberId
              },
              emailRedirectTo: null // Skip email confirmation for Squarespace members
            }
          });
          
          if (!signUpError) {
            // Now sign them in
            await supabase.auth.signInWithPassword({
              email: email,
              password: `abfi_${memberId || email}`
            });
          }
        }
        
        // Success - redirect to app
        setStatus('success');
        setTimeout(() => {
          router.replace('/legendary?mode=analysis');
        }, 1000);
        
      } catch (error) {
        console.error('Auth error:', error);
        setStatus('error');
      }
    } else {
      // No Squarespace data - show instructions
      setStatus('no-data');
    }
  };
  
  if (status === 'authenticating') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl text-white">Authenticating Always Bent Member...</h2>
        </div>
      </div>
    );
  }
  
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl text-white mb-2">Welcome Back, Captain!</h2>
          <p className="text-cyan-400">Redirecting to ABFI...</p>
        </div>
      </div>
    );
  }
  
  if (status === 'no-data') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 max-w-md">
          <Anchor className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl text-white mb-4">Squarespace Integration</h2>
          
          <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-slate-300 mb-3">
              To enable seamless login from Squarespace:
            </p>
            <ol className="text-sm text-slate-400 space-y-2">
              <li>1. Add this URL to your Squarespace member area button:</li>
              <li className="font-mono text-xs bg-black/50 p-2 rounded break-all">
                https://always-bent.vercel.app/auth/squarespace?email=[member_email]&name=[member_name]&member_id=[member_id]
              </li>
              <li>2. Replace the brackets with actual member data</li>
              <li>3. Members will auto-login when they click the link</li>
            </ol>
          </div>
          
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
          >
            Go to Regular Login
          </button>
        </div>
      </div>
    );
  }
  
  return null;
}
