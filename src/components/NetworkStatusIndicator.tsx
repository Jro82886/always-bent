'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, Cloud, CloudOff } from 'lucide-react';

export default function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [pendingBites, setPendingBites] = useState(0);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Check for pending bites in localStorage
    const checkPendingBites = () => {
      const bites = JSON.parse(localStorage.getItem('abfi_offline_bites') || '[]');
      setPendingBites(bites.length);
    };
    checkPendingBites();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Show encouraging message when coming back online
      const toast = document.createElement('div');
      toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-down';
      toast.innerHTML = `
        <div class="bg-slate-900/95 backdrop-blur-xl border border-green-500/30 rounded-lg px-6 py-4 shadow-2xl">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
              </svg>
            </div>
            <div>
              <div class="text-white font-semibold">Back Online!</div>
              <div class="text-gray-400 text-sm mt-1">${pendingBites > 0 ? `Syncing ${pendingBites} offline bite${pendingBites > 1 ? 's' : ''}...` : 'All data synced'}</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Show encouraging message for offline mode
      const toast = document.createElement('div');
      toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-down';
      toast.innerHTML = `
        <div class="bg-slate-900/95 backdrop-blur-xl border border-orange-500/30 rounded-lg px-6 py-4 shadow-2xl">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path>
              </svg>
            </div>
            <div>
              <div class="text-white font-semibold">Offline Mode Active</div>
              <div class="text-gray-400 text-sm mt-1">Keep logging bites! They\'ll sync when you\'re back</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check periodically for pending bites
    const interval = setInterval(checkPendingBites, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [pendingBites]);

  return (
    <>
      {/* Subtle Status Bar - Top Right Corner */}
      <div className="fixed top-20 right-4 z-50">
        <div 
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className={`
            px-3 py-2 rounded-lg backdrop-blur-xl border transition-all cursor-pointer
            ${isOnline 
              ? 'bg-slate-900/80 border-green-500/20 hover:border-green-500/40' 
              : 'bg-slate-900/80 border-orange-500/30 hover:border-orange-500/50'
            }
          `}>
            <div className="flex items-center gap-2">
              {/* Network Icon */}
              {isOnline ? (
                <Cloud className="w-4 h-4 text-green-400" />
              ) : (
                <CloudOff className="w-4 h-4 text-orange-400" />
              )}
              
              {/* Status Text */}
              <span className={`text-xs font-medium ${isOnline ? 'text-green-400' : 'text-orange-400'}`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
              
              {/* Pending Counter Badge */}
              {!isOnline && pendingBites > 0 && (
                <div className="bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {pendingBites}
                </div>
              )}
            </div>
          </div>
          
          {/* Hover Tooltip with More Info */}
          {showTooltip && (
            <div className="absolute top-full right-0 mt-2 w-72 pointer-events-none">
              <div className="bg-slate-900/95 backdrop-blur-xl rounded-lg border border-cyan-500/20 shadow-2xl p-4">
                {isOnline ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Wifi className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-semibold text-green-400">Connected to Internet</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Your bites are syncing in real-time with the ABFI network. 
                      All community data is up to date.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <WifiOff className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-semibold text-orange-400">Working Offline</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      No internet? No problem! Keep logging bites - they're saved locally 
                      and will automatically sync when you're back online.
                    </p>
                    {pendingBites > 0 && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded px-3 py-2">
                        <div className="text-xs text-orange-400">
                          <span className="font-semibold">{pendingBites} bite{pendingBites > 1 ? 's' : ''}</span> waiting to sync
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Offline Mode Feature Callout - Shows once when first going offline */}
      {!isOnline && typeof window !== 'undefined' && !localStorage.getItem('abfi_offline_mode_seen') && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-gradient-to-r from-orange-600/20 to-amber-600/20 backdrop-blur-xl rounded-xl border border-orange-500/30 shadow-2xl p-5 max-w-md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <CloudOff className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-2">Offline Mode is Active! 🎣</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Lost signal? Don't worry! ABFI works offline too. Every bite you log is 
                  saved locally and will automatically sync when you're back in range.
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      localStorage.setItem('abfi_offline_mode_seen', 'true');
                      const el = document.querySelector('.animate-slide-up');
                      if (el) el.remove();
                    }}
                    className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Got it!
                  </button>
                  <span className="text-xs text-gray-500">
                    Keep fishing, keep logging
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes slide-down {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
