'use client';

import { useState, useEffect, useRef } from 'react';
import { Anchor, WifiOff, Wifi, Navigation, AlertCircle } from 'lucide-react';

interface DepartureMonitorProps {
  userPosition: { lat: number; lng: number } | null;
  selectedInletId: string;
  trackingActive: boolean;
}

export default function DepartureMonitor({ 
  userPosition, 
  selectedInletId,
  trackingActive 
}: DepartureMonitorProps) {
  const [showDeparturePrompt, setShowDeparturePrompt] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [hasAskedThisTrip, setHasAskedThisTrip] = useState(false);
  const lastPositionRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const speedHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    if (!userPosition || !trackingActive || hasAskedThisTrip) return;

    const now = Date.now();
    
    if (lastPositionRef.current) {
      const timeDelta = (now - lastPositionRef.current.time) / 1000; // seconds
      
      if (timeDelta > 0) {
        // Calculate distance moved (simplified haversine)
        const R = 3959; // Earth radius in miles
        const dLat = (userPosition.lat - lastPositionRef.current.lat) * Math.PI / 180;
        const dLon = (userPosition.lng - lastPositionRef.current.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lastPositionRef.current.lat * Math.PI / 180) * 
                  Math.cos(userPosition.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // miles
        
        const speed = (distance / timeDelta) * 3600; // mph
        
        // Keep rolling average of last 5 speed readings
        speedHistoryRef.current.push(speed);
        if (speedHistoryRef.current.length > 5) {
          speedHistoryRef.current.shift();
        }
        
        const avgSpeed = speedHistoryRef.current.reduce((a, b) => a + b, 0) / speedHistoryRef.current.length;
        
        // Detect departure: moving faster than 3 knots (3.45 mph) consistently
        if (avgSpeed > 3.45 && speedHistoryRef.current.length >= 3) {
          if (!isMoving) {
            setIsMoving(true);
            console.log('[DEPARTURE] Vessel is moving, speed:', avgSpeed.toFixed(1), 'mph');
            
            // Check if we haven't asked in the last 4 hours
            const lastAsked = localStorage.getItem('abfi_departure_asked');
            const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
            
            if (!lastAsked || parseInt(lastAsked) < fourHoursAgo) {
              // Wait 30 seconds after movement detected to confirm they're really leaving
              setTimeout(() => {
                if (speedHistoryRef.current.length > 0 && 
                    speedHistoryRef.current[speedHistoryRef.current.length - 1] > 3.45) {
                  setShowDeparturePrompt(true);
                  localStorage.setItem('abfi_departure_asked', Date.now().toString());
                }
              }, 30000);
            }
          }
        } else if (avgSpeed < 1 && isMoving) {
          // Stopped moving
          setIsMoving(false);
          speedHistoryRef.current = [];
        }
      }
    }
    
    lastPositionRef.current = { ...userPosition, time: now };
  }, [userPosition, trackingActive, hasAskedThisTrip, isMoving]);

  const handleInternetResponse = (hasInternet: boolean) => {
    setShowDeparturePrompt(false);
    setHasAskedThisTrip(true);
    
    if (!hasInternet) {
      // Enable offline mode features
      localStorage.setItem('abfi_offline_trip', 'true');
      localStorage.setItem('abfi_trip_start', Date.now().toString());
      
      // Show encouraging message
      const toast = document.createElement('div');
      toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-down';
      toast.innerHTML = `
        <div class="bg-gradient-to-r from-orange-600/20 to-amber-600/20 backdrop-blur-xl rounded-xl border border-orange-500/30 shadow-2xl p-5 max-w-md">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-white font-bold mb-2">Offline Mode Activated! 🎣</h3>
              <p class="text-gray-300 text-sm mb-2">
                Perfect! Every bite you log will be saved locally and automatically 
                synced when you're back at the dock with signal.
              </p>
              <p class="text-orange-300 text-xs font-medium">
                Tip: Hit ABFI button instantly when you get a bite - we'll capture all the ocean data!
              </p>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 8000);
    } else {
      // Online mode confirmed
      localStorage.setItem('abfi_online_trip', 'true');
      
      // Show confirmation
      const toast = document.createElement('div');
      toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-down';
      toast.innerHTML = `
        <div class="bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-xl rounded-xl border border-green-500/30 shadow-2xl p-5 max-w-md">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-white font-bold mb-2">Connected Mode! 📡</h3>
              <p class="text-gray-300 text-sm">
                Great! Your bites will sync in real-time with the ABFI network. 
                You'll see live updates from other vessels too.
              </p>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 5000);
    }
  };

  const handleLater = () => {
    setShowDeparturePrompt(false);
    // Ask again in 30 minutes
    setTimeout(() => {
      if (isMoving && !hasAskedThisTrip) {
        setShowDeparturePrompt(true);
      }
    }, 30 * 60 * 1000);
  };

  if (!showDeparturePrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 px-6 py-5 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Anchor className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Heading Offshore?</h2>
              <p className="text-cyan-400/80 text-sm">Let's prepare your trip settings</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Navigation className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div>
                <p className="text-gray-300 text-sm">
                  We noticed you're leaving the inlet. Will you have internet connection 
                  while you're offshore today?
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  This helps us optimize the app for your trip
                </p>
              </div>
            </div>
          </div>
          
          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleInternetResponse(true)}
              className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg p-4 transition-all group"
            >
              <Wifi className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-white font-semibold">Yes, I'll have signal</div>
              <div className="text-green-400/70 text-xs mt-1">Starlink, cellular, etc</div>
            </button>
            
            <button
              onClick={() => handleInternetResponse(false)}
              className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 transition-all group"
            >
              <WifiOff className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <div className="text-white font-semibold">No internet today</div>
              <div className="text-orange-400/70 text-xs mt-1">Enable offline mode</div>
            </button>
          </div>
          
          {/* Info */}
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-cyan-300">
                <span className="font-semibold">Either way works great!</span> ABFI is designed 
                to work perfectly with or without internet. Your bites always matter.
              </div>
            </div>
          </div>
          
          {/* Skip button */}
          <button
            onClick={handleLater}
            className="w-full py-2 text-gray-500 hover:text-gray-400 text-sm transition-colors"
          >
            Ask me later
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide-down {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
