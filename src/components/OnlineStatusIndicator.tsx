'use client';

import { useState, useEffect } from 'react';
import { Cloud, CloudOff } from 'lucide-react';

export default function OnlineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine);
    
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <div className="fixed top-4 right-4 z-[100] pointer-events-auto">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-xl border ${
        isOnline 
          ? 'bg-slate-900/80 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
          : 'bg-slate-900/80 border-orange-500/30 shadow-[0_0_10px_rgba(251,146,60,0.2)]'
      }`}>
        {isOnline ? (
          <Cloud className="w-4 h-4 text-green-400" />
        ) : (
          <CloudOff className="w-4 h-4 text-orange-400" />
        )}
        <span className={`text-xs font-medium uppercase tracking-wider ${
          isOnline ? 'text-green-400' : 'text-orange-400'
        }`}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>
    </div>
  );
}
