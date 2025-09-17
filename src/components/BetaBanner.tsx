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
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900/90 to-pink-900/90 backdrop-blur-sm border-t border-purple-500/30 z-40">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-yellow-400 animate-pulse" />
            <div className="text-xs text-white">
              <span className="font-bold">BETA TESTING:</span>
              <span className="ml-2 opacity-90">
                Testing new features. Report issues with feedback button.
              </span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
