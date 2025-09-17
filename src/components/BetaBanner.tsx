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
    <div className="fixed bottom-4 right-4 max-w-md bg-gradient-to-r from-purple-900/95 to-pink-900/95 backdrop-blur-sm border border-purple-500/30 rounded-lg shadow-2xl z-40 animate-slide-up">
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400 animate-pulse flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white flex-1">
            <span className="font-bold block mb-1">BETA TESTING MODE</span>
            <span className="opacity-90 text-xs">
              Testing new features. Report issues with feedback button.
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors flex-shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
