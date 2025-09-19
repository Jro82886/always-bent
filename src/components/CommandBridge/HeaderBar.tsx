'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Anchor } from 'lucide-react';
import WelcomeChip from './WelcomeChip';
import InletChip from './InletChip';
import { useAppState } from '@/store/appState';
import { useInletFromURL } from '@/hooks/useInletFromURL';

interface HeaderBarProps {
  activeMode?: string;
}

const TAB_MODES = {
  'Analysis': 'analysis',
  'Tracking': 'tracking',
  'Community': 'community',
  'Trends': 'trends'
};

export default function HeaderBar({ activeMode = 'analysis' }: HeaderBarProps) {
  const router = useRouter();
  const { selectedInletId } = useAppState();
  
  // Sync inlet from URL on mount
  useInletFromURL();
  
  // Find current tab based on mode
  const currentTab = Object.entries(TAB_MODES).find(([_, mode]) => mode === activeMode)?.[0] || 'Analysis';
  
  const handleTabChange = (tab: string) => {
    const mode = TAB_MODES[tab as keyof typeof TAB_MODES];
    if (mode) {
      // Preserve inlet selection in URL
      const params = new URLSearchParams();
      params.set('mode', mode);
      if (selectedInletId) {
        params.set('inlet', selectedInletId);
      }
      router.push(`/legendary?${params.toString()}`);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-gray-950 via-gray-900/95 to-gray-900/90 backdrop-blur-lg border-b border-cyan-500/20">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        
        {/* Desktop Layout ≥1024px */}
        <div className="hidden lg:flex items-center justify-between h-16">
          {/* Left: Brand */}
          <div className="px-6 flex items-center gap-2 h-full">
            <Anchor className="w-5 h-5 text-cyan-400" />
            <div className="flex flex-col">
              <div className="text-xs font-bold text-cyan-100"
                   style={{ 
                     textShadow: '0 0 20px rgba(0, 200, 255, 0.5)',
                     letterSpacing: '0.15em'
                   }}>
                ALWAYS BENT
              </div>
              <div className="text-[10px] text-cyan-400/70 tracking-widest uppercase">
                Command Bridge
              </div>
            </div>
          </div>
          
          {/* Center: Welcome + Inlet */}
          <div className="flex items-center gap-6">
            <WelcomeChip />
            <InletChip />
          </div>
          
          {/* Right: Tabs */}
          <div className="flex h-full">
            {Object.keys(TAB_MODES).map((tab) => {
              const isActive = tab === currentTab;
              
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`
                    px-6 h-full border-l border-cyan-500/10 transition-all relative group
                    ${isActive 
                      ? 'bg-gradient-to-b from-cyan-500/10 to-transparent text-cyan-300' 
                      : 'hover:bg-cyan-500/5 text-gray-400 hover:text-cyan-300'
                    }
                  `}
                >
                  <span className="text-sm font-medium">{tab}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Tablet Layout 640px-1024px */}
        <div className="hidden sm:flex lg:hidden flex-col">
          {/* Top Row: Brand + Inlet */}
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-2">
              <Anchor className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-cyan-100" style={{ letterSpacing: '0.1em' }}>
                ALWAYS BENT
              </span>
            </div>
            <InletChip />
          </div>
          
          {/* Bottom Row: Scrollable Tabs */}
          <div className="flex overflow-x-auto border-t border-cyan-500/10">
            {Object.keys(TAB_MODES).map((tab) => {
              const isActive = tab === currentTab;
              
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`
                    px-4 py-2 whitespace-nowrap transition-all relative
                    ${isActive 
                      ? 'bg-gradient-to-b from-cyan-500/10 to-transparent text-cyan-300' 
                      : 'text-gray-400 hover:text-cyan-300'
                    }
                  `}
                >
                  <span className="text-sm font-medium">{tab}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Mobile Layout <640px */}
        <div className="flex sm:hidden flex-col">
          {/* Top Row: Brand + Inlet (compact) */}
          <div className="flex items-center justify-between h-12 px-3">
            <div className="flex items-center gap-1">
              <Anchor className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-bold text-cyan-100">ABFI</span>
            </div>
            <InletChip compact />
          </div>
          
          {/* Bottom Row: Scrollable Tabs */}
          <div className="flex overflow-x-auto border-t border-cyan-500/10">
            {Object.keys(TAB_MODES).map((tab) => {
              const isActive = tab === currentTab;
              
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`
                    px-3 py-2 whitespace-nowrap transition-all relative
                    ${isActive 
                      ? 'text-cyan-300' 
                      : 'text-gray-400'
                    }
                  `}
                >
                  <span className="text-xs font-medium">{tab}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
