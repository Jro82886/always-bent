'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function BetaBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner this session
    const dismissed = sessionStorage.getItem('betaBannerDismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('betaBannerDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-900/95 to-pink-900/95 backdrop-blur-sm border-b border-purple-500/30 z-40 animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 animate-pulse" />
            <div className="text-sm text-white">
              <span className="font-bold">BETA TESTING MODE:</span>
              <span className="ml-2 opacity-90">
                Welcome Captain! We're testing new features this week. 
                Please report any issues using the feedback button. 
                Your patience helps us build a better platform for all.
              </span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors ml-4"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
