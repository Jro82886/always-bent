import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top',
  delay = 200,
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    let x = rect.left + rect.width / 2;
    let y = rect.top;

    switch (position) {
      case 'top':
        y = rect.top - 8;
        break;
      case 'bottom':
        y = rect.bottom + 8;
        break;
      case 'left':
        x = rect.left - 8;
        y = rect.top + rect.height / 2;
        break;
      case 'right':
        x = rect.right + 8;
        y = rect.top + rect.height / 2;
        break;
    }

    setCoords({ x, y });
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className={`fixed z-[99999] pointer-events-none ${className}`}
          style={{
            left: coords.x,
            top: coords.y,
            transform: position === 'top' ? 'translate(-50%, -100%)' :
                      position === 'bottom' ? 'translate(-50%, 0)' :
                      position === 'left' ? 'translate(-100%, -50%)' :
                      'translate(0, -50%)'
          }}
        >
          <div className="relative">
            {/* Tooltip content */}
            <div className="bg-slate-900/95 backdrop-blur-xl text-white px-3 py-2 rounded-lg 
                          border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)]
                          animate-fade-in-scale">
              <div className="text-sm max-w-xs">
                {content}
              </div>
            </div>
            
            {/* Arrow */}
            <div 
              className="absolute w-2 h-2 bg-slate-900/95 border border-cyan-500/30 rotate-45"
              style={{
                ...position === 'top' ? { bottom: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' } :
                   position === 'bottom' ? { top: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' } :
                   position === 'left' ? { right: '-5px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' } :
                   { left: '-5px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export function HelpTooltip({ content, size = 16 }: { content: string; size?: number }) {
  return (
    <Tooltip content={content}>
      <HelpCircle 
        size={size} 
        className="text-cyan-400/60 hover:text-cyan-400 transition-colors cursor-help" 
      />
    </Tooltip>
  );
}

export function InfoTooltip({ content, size = 16 }: { content: string; size?: number }) {
  return (
    <Tooltip content={content}>
      <Info 
        size={size} 
        className="text-blue-400/60 hover:text-blue-400 transition-colors cursor-help" 
      />
    </Tooltip>
  );
}

// Animated help beacon for first-time users
export function HelpBeacon({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-[9999] group"
      aria-label="Get help"
    >
      <div className="relative">
        {/* Pulsing rings */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
        <div className="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping animation-delay-500" />
        
        {/* Main button */}
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 
                      flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)]
                      group-hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] transition-all
                      group-hover:scale-110">
          <HelpCircle className="text-white" size={24} />
        </div>
        
        {/* Floating label */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 
                      bg-slate-900/90 px-3 py-1 rounded-full text-xs text-cyan-100
                      opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Need help?
        </div>
      </div>
    </button>
  );
}

// Contextual help cards
export function HelpCard({ 
  title, 
  description, 
  tips,
  onClose 
}: { 
  title: string;
  description: string;
  tips?: string[];
  onClose?: () => void;
}) {
  return (
    <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl p-4 
                  border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.3)]
                  animate-slide-in-up max-w-sm">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-cyan-100">{title}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        )}
      </div>
      
      <p className="text-sm text-gray-300 mb-3">{description}</p>
      
      {tips && tips.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-cyan-400">Pro Tips:</p>
          <ul className="space-y-1">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Tooltip animation styles
export const tooltipStyles = `
  @keyframes fade-in-scale {
    0% {
      opacity: 0;
      transform: scale(0.95);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes slide-in-up {
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-scale {
    animation: fade-in-scale 0.2s ease-out;
  }
  
  .animate-slide-in-up {
    animation: slide-in-up 0.3s ease-out;
  }
`;