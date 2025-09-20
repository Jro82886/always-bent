'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, LogIn, X } from 'lucide-react';
import { getSessionInfo, extendSession } from '@/lib/supabase/session';
import { useRouter } from 'next/navigation';

export default function SessionWarning() {
  const router = useRouter();
  const [warning, setWarning] = useState<{
    type: 'expiring-soon' | 'expiring-now' | 'expired' | null;
    hoursRemaining?: number;
  }>({ type: null });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check session status every 30 minutes
    const checkSession = () => {
      const session = getSessionInfo();
      
      if (!session.isLoggedIn) {
        // Session expired
        if (!dismissed) {
          setWarning({ type: 'expired' });
        }
        return;
      }
      
      const hours = session.hoursRemaining || 0;
      
      // Show warnings at specific intervals
      if (hours <= 1 && hours > 0) {
        setWarning({ type: 'expiring-now', hoursRemaining: hours });
      } else if (hours <= 24 && hours > 1) {
        setWarning({ type: 'expiring-soon', hoursRemaining: hours });
      } else {
        setWarning({ type: null });
      }
    };
    
    // Check immediately
    checkSession();
    
    // Then check every 30 minutes
    const interval = setInterval(checkSession, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [dismissed]);

  const handleExtendSession = async () => {
    const extended = await extendSession();
    if (extended) {
      setWarning({ type: null });
      setDismissed(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setWarning({ type: null });
    
    // Reset dismiss after 4 hours
    setTimeout(() => setDismissed(false), 4 * 60 * 60 * 1000);
  };

  const handleRelogin = () => {
    router.push('/legendary?mode=analysis');
  };

  if (!warning.type || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-slide-up">
      <div className={`
        bg-slate-900/95 backdrop-blur-xl rounded-lg border p-4 shadow-2xl
        min-w-[320px] max-w-md
        ${warning.type === 'expired' 
          ? 'border-red-500/50 shadow-red-500/20' 
          : warning.type === 'expiring-now'
          ? 'border-orange-500/50 shadow-orange-500/20'
          : 'border-yellow-500/50 shadow-yellow-500/20'
        }
      `}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {warning.type === 'expired' ? (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />
            )}
            <h3 className="font-semibold text-white">
              {warning.type === 'expired' 
                ? 'Session Expired' 
                : warning.type === 'expiring-now'
                ? 'Session Expiring Soon!'
                : 'Session Reminder'
              }
            </h3>
          </div>
          {warning.type !== 'expired' && (
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Message */}
        <p className="text-sm text-slate-300 mb-4">
          {warning.type === 'expired' 
            ? 'Your session has expired. Please log in again to continue.'
            : warning.type === 'expiring-now'
            ? `Your session will expire in less than ${Math.ceil(warning.hoursRemaining || 1)} hour.`
            : `Your session will expire in ${Math.round(warning.hoursRemaining || 24)} hours.`
          }
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          {warning.type === 'expired' ? (
            <button
              onClick={handleRelogin}
              className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Log In Again
            </button>
          ) : (
            <>
              <button
                onClick={handleExtendSession}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
              >
                Extend Session
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Remind Later
              </button>
            </>
          )}
        </div>

        {/* Extra info for non-expired */}
        {warning.type !== 'expired' && (
          <p className="text-xs text-slate-500 mt-3 text-center">
            Stay logged in to keep your fishing data synced
          </p>
        )}
      </div>
    </div>
  );
}

// Add animation styles to globals.css
const animationStyles = `
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
`;
