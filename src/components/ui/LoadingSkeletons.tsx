import React from 'react';

/**
 * Beautiful loading skeletons with shimmer effect
 */

export function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gradient-to-r from-transparent via-white/10 to-transparent 
                      animate-shimmer bg-[length:200%_100%]" />
    </div>
  );
}

export function MapLoadingSkeleton() {
  return (
    <div className="relative w-full h-full bg-slate-900">
      {/* Animated ocean waves */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-cyan-900/20" />
        
        {/* Wave animations */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-32 opacity-30"
            style={{
              bottom: `${i * 60}px`,
              background: `linear-gradient(180deg, transparent, rgba(6,182,212,${0.1 + i * 0.05}))`,
              animation: `wave ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>
      
      {/* Loading message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            {/* Spinning compass */}
            <div className="w-24 h-24 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/40 
                            border-t-cyan-400 animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-cyan-500/20" />
              <div className="absolute inset-2 rounded-full border-2 border-cyan-500/30 
                            border-b-cyan-300 animate-spin-slow" />
              
              {/* Compass needle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-12 bg-gradient-to-t from-red-500 to-white animate-pulse" />
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-cyan-100 mb-2">
            Charting the waters...
          </h3>
          <p className="text-sm text-cyan-300/60">
            Loading ocean intelligence
          </p>
          
          {/* Progress dots */}
          <div className="flex justify-center gap-1 mt-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-cyan-400"
                style={{
                  animation: `bounce 1.4s ease-in-out infinite`,
                  animationDelay: `${i * 0.16}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DataCardSkeleton() {
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-4 border border-cyan-500/20">
      <div className="space-y-3">
        <div className="h-4 bg-cyan-500/10 rounded animate-pulse" />
        <div className="h-8 bg-cyan-500/10 rounded animate-pulse w-3/4" />
        <div className="flex gap-2">
          <div className="h-3 bg-cyan-500/10 rounded animate-pulse flex-1" />
          <div className="h-3 bg-cyan-500/10 rounded animate-pulse flex-1" />
        </div>
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
      <div className="w-10 h-10 rounded-full bg-cyan-500/10 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-cyan-500/10 rounded animate-pulse w-2/3" />
        <div className="h-2 bg-cyan-500/10 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

// Add shimmer animation to global CSS
export const shimmerStyles = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes wave {
    0%, 100% { transform: translateY(0) scaleY(1); }
    50% { transform: translateY(-20px) scaleY(0.8); }
  }
  
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(-360deg); }
  }
  
  .animate-shimmer {
    animation: shimmer 2s ease-in-out infinite;
  }
  
  .animate-spin-slow {
    animation: spin-slow 8s linear infinite;
  }
`;
