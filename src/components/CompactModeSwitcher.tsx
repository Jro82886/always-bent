'use client';

import { useState } from 'react';
import { Radio, Brain, ArrowLeftRight } from 'lucide-react';

interface CompactModeSwitcherProps {
  currentMode: 'analysis' | 'tracking';
  onSwitch: () => void;
}

export default function CompactModeSwitcher({ 
  currentMode, 
  onSwitch 
}: CompactModeSwitcherProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const isAnalysis = currentMode === 'analysis';
  const targetMode = isAnalysis ? 'Live Tracking' : 'Historical Analysis';
  const Icon = isAnalysis ? Radio : Brain;
  const iconColor = isAnalysis ? 'text-orange-400' : 'text-cyan-400';
  const bgColor = isAnalysis ? 'bg-orange-500/20' : 'bg-cyan-500/20';
  const borderColor = isAnalysis ? 'border-orange-500/30' : 'border-cyan-500/30';
  const hoverBg = isAnalysis ? 'hover:bg-orange-500/30' : 'hover:bg-cyan-500/30';
  
  return (
    <div 
      className="fixed bottom-6 right-20 z-30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onSwitch}
        className={`
          group relative flex items-center gap-2 
          ${bgColor} ${borderColor} ${hoverBg}
          backdrop-blur-md border rounded-full 
          transition-all duration-300 ease-in-out
          ${isHovered ? 'px-4 py-2 shadow-lg' : 'p-2 shadow-md'}
        `}
        aria-label={`Switch to ${targetMode}`}
      >
        {/* Icon - always visible with subtle pulse */}
        <div className="relative">
          <Icon 
            size={isHovered ? 14 : 16} 
            className={`${iconColor} transition-all duration-300`}
          />
          {/* Subtle pulse effect */}
          <div className={`absolute inset-0 ${bgColor} rounded-full animate-ping opacity-30`} />
        </div>
        
        {/* Text - only visible on hover */}
        <div className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isHovered ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'}
        `}>
          <div className="flex items-center gap-1 whitespace-nowrap">
            <ArrowLeftRight size={12} className={iconColor} />
            <span className={`text-xs font-medium ${
              isAnalysis ? 'text-orange-300' : 'text-cyan-300'
            }`}>
              Switch to {targetMode}
            </span>
          </div>
        </div>
      </button>
      
      {/* Tooltip for extra clarity - shows above on hover */}
      {isHovered && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg px-3 py-2 whitespace-nowrap border border-slate-700/50 shadow-xl">
            <div className={`text-xs font-medium ${
              isAnalysis ? 'text-orange-300' : 'text-cyan-300'
            }`}>
              {isAnalysis ? 'View live vessel positions' : 'Analyze historical patterns'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
