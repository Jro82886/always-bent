'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import WelcomeChip from './WelcomeChip';
import InletChip from './InletChip';
import { CommandBridgeTabs } from './CommandBridgeTabs';
import '@/styles/command-bridge-tabs.css';
import { useAppState } from '@/lib/store';
import { useInletFromURL } from '@/hooks/useInletFromURL';
import AbfiBiteButton from '@/components/common/AbfiBiteButton';
import '@/styles/abfi.css';
import { useMemberstack } from '@/lib/memberstack/MemberstackProvider';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { User, LogOut, Settings } from 'lucide-react';

interface HeaderBarProps {
  activeMode?: string;
  showInletSelector?: boolean;
  showWeather?: boolean;
  showChat?: boolean;
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
  const { member, logout, loading: memberLoading } = useMemberstack();

  // Sync inlet from URL on mount
  useInletFromURL();

  const handleLogout = async () => {
    try {
      await logout();
      // Memberstack handles redirect to home page
    } catch (error: any) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    }
  };
  
  // We'll use the globe icon with the text branding
  
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
        <div className="hidden lg:flex items-center h-16">
          {/* Brand (clickable → Analysis) */}
          <Link 
            href="/legendary/analysis"
            aria-label="Always Bent Home"
            className="px-6 flex items-center gap-3 h-full hover:bg-cyan-500/5 transition-colors group"
          >
            <img
              src="/brand/globe.svg"
              alt="Always Bent"
              className="h-10 w-10 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] group-hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all"
              loading="eager"
              decoding="async"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-wide bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">ALWAYS BENT</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70 font-medium">Command Bridge</span>
            </div>
          </Link>
          
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
          <CommandBridgeTabs />
          
          {/* Spacer to push everything left */}
          <div className="flex-1" />

          {/* ABFI bite pill (visible on Analysis + Tracking) */}
          {(activeMode === 'analysis' || activeMode === 'tracking') && (
            <div className="px-4 hidden lg:block">
              <AbfiBiteButton compact context={activeMode as any} />
            </div>
          )}

          {/* User Menu */}
          <div className="px-4">
            {!memberLoading && (
              <>
                {member ? (
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="flex items-center gap-2 rounded-md bg-cyan-500/10 px-3 py-1.5 text-sm ring-1 ring-cyan-500/20 hover:ring-cyan-400/40 transition-all">
                        <User className="h-4 w-4 text-cyan-400" />
                        <span className="text-cyan-100">{member.email}</span>
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="min-w-[180px] rounded-md bg-gray-900 p-1 shadow-lg backdrop-blur border border-cyan-500/20 z-[9999]"
                        sideOffset={5}
                        align="end"
                      >
                        <DropdownMenu.Label className="px-2 py-1 text-xs font-semibold text-cyan-400/60">
                          My Account
                        </DropdownMenu.Label>
                        <DropdownMenu.Separator className="my-1 h-px bg-cyan-500/10" />
                        <DropdownMenu.Item
                          className="flex items-center gap-2 rounded px-2 py-1 text-sm text-cyan-100 outline-none hover:bg-cyan-500/10 cursor-pointer"
                          onSelect={() => window.location.href = '/account-billing'}
                        >
                          <Settings className="h-4 w-4" />
                          Account Settings
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="my-1 h-px bg-cyan-500/10" />
                        <DropdownMenu.Item
                          className="flex items-center gap-2 rounded px-2 py-1 text-sm text-red-400 outline-none hover:bg-red-500/10 cursor-pointer"
                          onSelect={handleLogout}
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="rounded-md bg-cyan-500/10 px-3 py-1.5 text-sm ring-1 ring-cyan-500/20 hover:ring-cyan-400/40 transition-all text-cyan-100"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => window.location.href = '/signup'}
                      className="rounded-md bg-cyan-500 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-cyan-400 transition-all"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Tablet Layout 640px-1024px */}
        <div className="hidden sm:flex lg:hidden flex-col">
          {/* Top Row: Brand + Inlet */}
          <div className="flex items-center justify-between h-14 px-4">
            <Link 
              href="/legendary/analysis"
              aria-label="Always Bent Home"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img
                src="/brand/globe.svg"
                alt="Always Bent"
                className="h-8 w-8 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                loading="eager"
                decoding="async"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-wide bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">ALWAYS BENT</span>
                <span className="text-[8px] uppercase tracking-wider text-cyan-300/70">Command Bridge</span>
              </div>
            </Link>
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
            <Link 
              href="/legendary/analysis"
              aria-label="Always Bent Home"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img
                src="/brand/globe.svg"
                alt="Always Bent"
                className="h-6 w-6 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                loading="eager"
                decoding="async"
              />
              <span className="text-xs font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">ALWAYS BENT</span>
            </Link>
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
