import React, { useEffect, useState } from 'react';
import { Check, Fish, Anchor, MapPin, TrendingUp, Sparkles } from 'lucide-react';

/**
 * Beautiful success animations and celebrations
 */

export function SuccessCheckmark({ onComplete }: { onComplete?: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative">
      {/* Ripple effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-green-500/20 animate-ping" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-green-500/30 animate-ping animation-delay-200" />
      </div>
      
      {/* Checkmark */}
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center
                      animate-scale-bounce shadow-[0_0_40px_rgba(34,197,94,0.5)]">
          <Check className="text-white" size={32} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
}

export function CatchAnimation({ species = 'Fish' }: { species?: string }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    // Create particle explosion
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.cos((i * 30) * Math.PI / 180) * 100,
      y: Math.sin((i * 30) * Math.PI / 180) * 100
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="relative w-64 h-64">
      {/* Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-cyan-400 rounded-full"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%)`,
            animation: `particle-explode 1s ease-out forwards`,
            '--end-x': `${particle.x}px`,
            '--end-y': `${particle.y}px`
          } as React.CSSProperties}
        />
      ))}
      
      {/* Central fish icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-wiggle">
          <Fish size={64} className="text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
        </div>
      </div>
      
      {/* Species text */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <span className="text-2xl font-bold text-cyan-100 animate-fade-in-up">
          {species} Caught!
        </span>
      </div>
      
      {/* Sparkles */}
      <Sparkles className="absolute top-4 right-4 text-yellow-400 animate-pulse" size={24} />
      <Sparkles className="absolute bottom-12 left-4 text-yellow-400 animate-pulse animation-delay-500" size={20} />
    </div>
  );
}

export function HotspotPulse({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="absolute pointer-events-none" 
         style={{ transform: 'translate(-50%, -50%)' }}>
      {/* Multiple expanding rings */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute inset-0 w-16 h-16 rounded-full border-2 border-red-500"
          style={{
            animation: `pulse-expand 3s ease-out infinite`,
            animationDelay: `${i * 1}s`,
            opacity: 1 - (i * 0.3)
          }}
        />
      ))}
      
      {/* Center dot */}
      <div className="relative w-4 h-4 bg-red-500 rounded-full 
                    shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse" />
    </div>
  );
}

export function WaveAnimation() {
  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(6,182,212,0.4)" />
          <stop offset="100%" stopColor="rgba(6,182,212,0.1)" />
        </linearGradient>
      </defs>
      
      {[...Array(3)].map((_, i) => (
        <path
          key={i}
          d={`M0,${100 + i * 20} Q${250 + i * 50},${80 + i * 20} 500,${100 + i * 20} T1000,${100 + i * 20}`}
          fill="none"
          stroke="url(#wave-gradient)"
          strokeWidth="2"
          opacity={0.6 - i * 0.2}
        >
          <animate
            attributeName="d"
            values={`M0,${100 + i * 20} Q${250 + i * 50},${80 + i * 20} 500,${100 + i * 20} T1000,${100 + i * 20};
                    M0,${100 + i * 20} Q${250 + i * 50},${120 + i * 20} 500,${100 + i * 20} T1000,${100 + i * 20};
                    M0,${100 + i * 20} Q${250 + i * 50},${80 + i * 20} 500,${100 + i * 20} T1000,${100 + i * 20}`}
            dur={`${3 + i}s`}
            repeatCount="indefinite"
          />
        </path>
      ))}
    </svg>
  );
}

export function FloatingBubbles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-white/10 rounded-full"
          style={{
            left: `${10 + i * 12}%`,
            bottom: '-10px',
            animation: `float-up ${10 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 1.5}s`
          }}
        />
      ))}
    </div>
  );
}

// Animation styles
export const animationStyles = `
  @keyframes scale-bounce {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  
  @keyframes particle-explode {
    0% { 
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    100% { 
      transform: translate(calc(-50% + var(--end-x)), calc(-50% + var(--end-y))) scale(0);
      opacity: 0;
    }
  }
  
  @keyframes wiggle {
    0%, 100% { transform: rotate(-5deg); }
    50% { transform: rotate(5deg); }
  }
  
  @keyframes fade-in-up {
    0% { 
      opacity: 0;
      transform: translateY(20px);
    }
    100% { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse-expand {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @keyframes float-up {
    0% {
      transform: translateY(0) translateX(0);
      opacity: 0;
    }
    10% {
      opacity: 0.5;
    }
    50% {
      transform: translateY(-300px) translateX(20px);
    }
    90% {
      opacity: 0.5;
    }
    100% {
      transform: translateY(-600px) translateX(-20px);
      opacity: 0;
    }
  }
  
  .animate-scale-bounce {
    animation: scale-bounce 0.5s ease-out;
  }
  
  .animate-wiggle {
    animation: wiggle 0.5s ease-in-out infinite;
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.5s ease-out;
  }
  
  .animation-delay-200 {
    animation-delay: 200ms;
  }
  
  .animation-delay-500 {
    animation-delay: 500ms;
  }
`;
