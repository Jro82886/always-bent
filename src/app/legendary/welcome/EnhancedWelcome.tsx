'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Loader2, ChevronRight, ChevronLeft, Waves, Fish, Eye, Users, Compass, PlayCircle } from 'lucide-react';
import Image from 'next/image';
import { useAppState } from '@/store/appState';
import { INLETS } from '@/lib/inlets';
import { INLET_COLORS } from '@/lib/inletColors';
import InletChip from '@/components/CommandBridge/InletChip';
import dynamic from 'next/dynamic';

// Dynamically import tutorial overlay to avoid SSR issues
const TutorialOverlay = dynamic(() => import('@/components/TutorialOverlay'), {
  ssr: false
});

export default function EnhancedWelcomePage() {
  const router = useRouter();
  const { selectedInletId, setSelectedInletId, setAppMode, setUsername } = useAppState();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: inlet selection, 2: mode choice, 3: tutorial option
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'community' | 'analysis'>('community');
  
  useEffect(() => {
    // Check if user has already completed onboarding
    const setupComplete = localStorage.getItem('abfi_setup_complete');
    const hasInlet = localStorage.getItem('abfi_selected_inlet');
    const hasMode = localStorage.getItem('abfi_app_mode');
    
    if (setupComplete === 'true' && hasInlet && hasMode) {
      // User has already onboarded, redirect to app
      router.replace('/legendary?mode=analysis');
    }
  }, [router]);
  
  const handleInletSelection = () => {
    if (!selectedInletId || selectedInletId === 'overview') {
      setError('Please select your inlet');
      return;
    }
    
    setError('');
    
    // Store inlet info (for Memberstack metadata later)
    const inlet = INLETS.find(i => i.id === selectedInletId);
    if (inlet) {
      localStorage.setItem('abfi_inlet_id', inlet.id);
      localStorage.setItem('abfi_inlet_name', inlet.name);
    }
    
    // Move to mode selection
    setStep(2);
  };
  
  const handleModeSelection = async (mode: 'community' | 'solo') => {
    setLoading(true);
    
    // Set the app mode
    const appMode = mode === 'solo' ? 'analysis' : 'community';
    setAppMode(appMode);
    setSelectedMode(appMode);
    
    // Store mode (for Memberstack metadata later)
    localStorage.setItem('abfi_mode', mode);
    
    if (mode === 'community') {
      // Request location permission
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        
        if (permission.state === 'granted') {
          localStorage.setItem('abfi_location_enabled', 'true');
        } else {
          // Request permission
          navigator.geolocation.getCurrentPosition(
            () => {
              localStorage.setItem('abfi_location_enabled', 'true');
            },
            () => {
              localStorage.setItem('abfi_location_enabled', 'false');
            }
          );
        }
      } catch {
        // Permissions API not supported, try directly
        navigator.geolocation.getCurrentPosition(
          () => {
            localStorage.setItem('abfi_location_enabled', 'true');
          },
          () => {
            localStorage.setItem('abfi_location_enabled', 'false');
          }
        );
      }
    }
    
    setLoading(false);
    // Move to tutorial option
    setStep(3);
  };
  
  const handleTutorialChoice = (takeTour: boolean) => {
    // Mark setup as complete
    localStorage.setItem('abfi_setup_complete', 'true');
    
    if (takeTour) {
      // Show tutorial overlay
      setShowTutorial(true);
      localStorage.setItem('abfi_has_seen_tutorial', 'false');
    } else {
      localStorage.setItem('abfi_has_seen_tutorial', 'true');
      // Navigate based on mode
      if (selectedMode === 'community') {
        router.replace('/legendary?mode=tracking');
      } else {
        router.replace('/legendary?mode=analysis');
      }
    }
  };
  
  const handleTutorialClose = () => {
    setShowTutorial(false);
    localStorage.setItem('abfi_has_seen_tutorial', 'true');
    // Tutorial component handles navigation
  };
  
  // Step 1: Inlet Selection
  if (step === 1) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
            
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl backdrop-blur-sm border border-cyan-500/30">
                  <Waves className="w-16 h-16 text-cyan-400" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Welcome to the ABFI Ocean Intelligence Platform
              </h1>
              <p className="text-slate-400 text-lg">
                Every journey starts at your home inlet. Pick yours to anchor your experience. You can change it anytime.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Use the actual InletChip component */}
              <div className="flex justify-center">
                <div className="scale-150 transform-origin-center">
                  <InletChip />
                </div>
              </div>
              
              {/* Show selected inlet info */}
              {selectedInletId && selectedInletId !== 'overview' && (
                <div className="flex items-center justify-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: INLET_COLORS[selectedInletId]?.color || '#3A3F47',
                      boxShadow: `0 0 10px ${INLET_COLORS[selectedInletId]?.color || '#3A3F47'}88`
                    }}
                  />
                  <span className="text-sm text-slate-400">
                    Your inlet color
                  </span>
                </div>
              )}

              <button
                onClick={handleInletSelection}
                disabled={!selectedInletId || selectedInletId === 'overview'}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg rounded-lg hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center justify-center gap-2">
                  Next → Choose How You Want to Fish
                  <ChevronRight className="w-5 h-5" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Step 2: Mode Selection
  if (step === 2) {
    const inlet = INLETS.find(i => i.id === selectedInletId);
    
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 w-full max-w-2xl">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
            
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-3">
                Choose How You Want to Fish Today
              </h1>
              <p className="text-slate-400">
                {inlet?.name} is ready for you
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Community Mode - BLUE */}
              <button
                onClick={() => handleModeSelection('community')}
                disabled={loading}
                className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl hover:border-blue-400/50 transition-all group text-left"
              >
                <div className="mb-4">
                  <div className="inline-flex p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors mb-4">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-blue-300">Join Community</h3>
                </div>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                  Share your live location with {inlet?.name}. See your fleet, vessels, and chat in real time. 
                  If you're offline offshore, your trip will sync when you're back online.
                </p>
                <div className="inline-flex items-center gap-2 text-blue-400 font-medium">
                  <span>Join Community</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              {/* Solo Mode - GREEN */}
              <button
                onClick={() => handleModeSelection('solo')}
                disabled={loading}
                className="p-6 bg-gradient-to-br from-emerald-500/10 to-green-600/10 border border-emerald-500/30 rounded-xl hover:border-emerald-400/50 transition-all group text-left"
              >
                <div className="mb-4">
                  <div className="inline-flex p-3 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors mb-4">
                    <Eye className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-emerald-300">Solo Mode</h3>
                </div>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                  Scout conditions, hotspots, and trends privately. Perfect for planning or tournaments 
                  when you don't want to share your location.
                </p>
                <div className="inline-flex items-center gap-2 text-emerald-400 font-medium">
                  <span>Solo Mode</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>

            {loading && (
              <div className="mt-6 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                <p className="text-sm text-slate-400 mt-2">Setting up your experience...</p>
              </div>
            )}
            
            {/* Back button */}
            <button
              onClick={() => setStep(1)}
              className="mt-6 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs font-medium hover:bg-white/15 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Step 3: Tutorial Option
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
          
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl backdrop-blur-sm border border-cyan-500/30">
                <Compass className="w-16 h-16 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Ready to Get Bent?
            </h1>
            <p className="text-slate-400">
              One more choice before you dive in
            </p>
          </div>

          <div className="space-y-4">
            {/* Take Tour */}
            <button
              onClick={() => handleTutorialChoice(true)}
              className="w-full p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl hover:border-emerald-400/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                  <PlayCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-emerald-300 mb-1">Take a Tour</h3>
                  <p className="text-sm text-slate-400">
                    A quick 1-minute walk-through of Command Bridge, Tracking, and Reports.
                  </p>
                </div>
              </div>
            </button>

            {/* Enter ABFI - Dynamic color based on user's path */}
            <button
              onClick={() => handleTutorialChoice(false)}
              className={`w-full p-4 border rounded-xl transition-all group ${
                selectedMode === 'community'
                  ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30 hover:border-blue-400/50'
                  : 'bg-gradient-to-br from-emerald-500/10 to-green-600/10 border-emerald-500/30 hover:border-emerald-400/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg transition-colors ${
                  selectedMode === 'community'
                    ? 'bg-blue-500/20 group-hover:bg-blue-500/30'
                    : 'bg-emerald-500/20 group-hover:bg-emerald-500/30'
                }`}>
                  <ChevronRight className={`w-6 h-6 ${
                    selectedMode === 'community' ? 'text-blue-400' : 'text-emerald-400'
                  }`} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className={`font-semibold mb-1 ${
                    selectedMode === 'community' ? 'text-blue-300' : 'text-emerald-300'
                  }`}>Enter ABFI</h3>
                  <p className="text-sm text-slate-400">
                    Jump right in — you can revisit the tour anytime in settings.
                  </p>
                </div>
              </div>
            </button>
          </div>
          
          {/* Back button */}
          <button
            onClick={() => setStep(2)}
            className="mt-6 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs font-medium hover:bg-white/15 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Back
          </button>

          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-cyan-400">
              <Fish className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Always Bent Fishing Intelligence</span>
              <Fish className="w-4 h-4 scale-x-[-1]" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Tutorial Overlay */}
      <TutorialOverlay 
        isOpen={showTutorial}
        onClose={handleTutorialClose}
        mode={selectedMode}
      />
    </div>
  );
}