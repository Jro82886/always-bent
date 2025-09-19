'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import WelcomeChip from './WelcomeChip';
import InletChip from './InletChip';
import Tabs from './Tabs';
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
  
  const handleBrandClick = () => {
    // Brand always returns to Analysis
    const params = new URLSearchParams();
    params.set('mode', 'analysis');
    if (selectedInletId) {
      params.set('inlet', selectedInletId);
    }
    router.push(`/legendary?${params.toString()}`);
  };
  
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
        <div className="hidden lg:flex items-center h-16">
          {/* Brand (clickable → Analysis) */}
          <button 
            onClick={handleBrandClick}
            className="px-6 flex items-center gap-2 h-full hover:bg-cyan-500/5 transition-colors cursor-pointer"
          >
            <Image src="/brand/globe.svg" alt="ABFI" width={28} height={28} className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
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
          </button>
          
          <div className="h-full w-px bg-cyan-500/10" />
          
          {/* Welcome */}
          <div className="px-6">
            <WelcomeChip />
          </div>
          
          <div className="h-full w-px bg-cyan-500/10" />
          
          {/* Inlet Selector */}
          <div className="px-6">
            <InletChip />
          </div>
          
          <div className="h-full w-px bg-cyan-500/10" />
          
          {/* Tabs (left-aligned) */}
          <Tabs activeMode={currentTab as 'analysis' | 'tracking' | 'community' | 'trends'} />
          
          {/* Spacer to push everything left */}
          <div className="flex-1" />
        </div>
        
        {/* Tablet Layout 640px-1024px */}
        <div className="hidden sm:flex lg:hidden flex-col">
          {/* Top Row: Brand + Inlet */}
          <div className="flex items-center justify-between h-14 px-4">
            <button 
              onClick={handleBrandClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Image src="/brand/globe.svg" alt="ABFI" width={24} height={24} className="drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]" />
              <span className="text-xs font-bold text-cyan-100" style={{ letterSpacing: '0.1em' }}>
                ALWAYS BENT
              </span>
            </button>
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
            <button 
              onClick={handleBrandClick}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Image src="/brand/globe.svg" alt="ABFI" width={24} height={24} className="drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]" />
              <span className="text-[11px] font-bold text-cyan-100">ABFI</span>
            </button>
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
