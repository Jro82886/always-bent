import { useState } from 'react';

export function useLocationRequired(locationEnabled: boolean) {
  const [showBanner, setShowBanner] = useState(false);
  
  // Gate function - only gates non-commercial features
  const gateNonCommercial = <T extends (...a:any[])=>any>(fn: T) =>
    (...args: Parameters<T>) => { 
      if (!locationEnabled) { 
        setShowBanner(true); 
        return; 
      } 
      return fn(...args); 
    };

  const LocationBanner = () => !showBanner ? null : (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-auto">
      <div className="bg-slate-900/95 backdrop-blur-sm border border-amber-500/30 rounded-lg p-4 shadow-lg max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm text-white mb-2">
              Enable location to see your fleet and rec boats.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  // Trigger location permission request
                  const event = new CustomEvent('request-location-permission');
                  window.dispatchEvent(event);
                  setShowBanner(false);
                }}
                className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-md text-sm hover:bg-cyan-500/30 transition-colors"
              >
                Enable My Location
              </button>
              <button 
                onClick={() => setShowBanner(false)}
                className="px-4 py-2 bg-white/5 text-white/60 rounded-md text-sm hover:bg-white/10 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DisabledBanner = () => !locationEnabled && !showBanner ? (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-auto">
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-600/30 rounded-lg px-4 py-2 shadow-lg">
        <p className="text-xs text-slate-400">
          Tracking requires sharing your location. Commercial vessels remain visible.
          <button 
            onClick={() => {
              const event = new CustomEvent('request-location-permission');
              window.dispatchEvent(event);
            }}
            className="ml-3 text-cyan-400 hover:text-cyan-300"
          >
            Re-enable Location
          </button>
        </p>
      </div>
    </div>
  ) : null;

  return { 
    gateNonCommercial, 
    LocationBanner, 
    DisabledBanner,
    showBanner,
    setShowBanner 
  };
}
