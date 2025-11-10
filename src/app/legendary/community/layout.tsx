'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAppState } from '@/lib/store';
import CommunityWrapper from './CommunityWrapper';

// Dynamic import for WeatherCard
const WeatherCard = dynamic(() => import('@/components/community/WeatherCard'), {
  ssr: false,
  loading: () => (
    <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-cyan-500/20 p-6">
      <div className="h-32 animate-pulse bg-slate-800/50 rounded"></div>
    </div>
  )
});

const PresenceBar = dynamic(() => import('@/components/chat/PresenceBar'), {
  ssr: false,
  loading: () => (
    <div className="abfi-card-bg rounded-xl p-4"><div className="h-16 animate-pulse bg-slate-800/50 rounded"/></div>
  )
});

const HighlightCarousel = dynamic(() => import('@/components/chat/HighlightCarousel'), {
  ssr: false,
  loading: () => (
    <div className="abfi-card-bg rounded-xl p-4"><div className="h-24 animate-pulse bg-slate-800/50 rounded"/></div>
  )
});

// Community components no longer use searchParams - static optimization enabled!
// No force-dynamic needed - we fixed the root cause!

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChat = pathname.includes('/chat');
  const isReports = pathname.includes('/reports');
  const { selectedInletId } = useAppState();
  const inletId = selectedInletId || 'ny-montauk';

  return (
    <CommunityWrapper>
      <div className="flex flex-col h-full">
      {/* Desktop Tab Bar */}
      <div className="hidden md:flex bg-slate-900 border-b border-cyan-500/20">
        {/* Chat tab hidden for MVP */}
        {/*
        <Link
          href="/legendary/community/chat"
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            isChat
              ? 'text-cyan-400 bg-slate-800/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Chat
          {isChat && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
          )}
        </Link>
        */}
        <Link
          href="/legendary/community/reports"
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            isReports
              ? 'text-cyan-400 bg-slate-800/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Reports
          {isReports && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
          )}
        </Link>
      </div>

      {/* Content with Weather Sidebar on Desktop */}
      <div className="flex-1 overflow-hidden flex">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
        
        {/* Weather Sidebar - Desktop Only */}
        <div className="hidden lg:block w-80 bg-slate-950/50 border-l border-cyan-500/20 p-4 overflow-y-auto space-y-4">
          {isChat && (
            <>
              <PresenceBar roomId={isChat ? 'inlet:' + inletId : 'global:tuna'} inletId={inletId} showDM={false} />
              <HighlightCarousel />
            </>
          )}
          <WeatherCard />
        </div>
      </div>

      {/* Mobile Bottom Tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-cyan-500/20 z-50">
        <div className="grid grid-cols-1">
          {/* Chat tab hidden for MVP */}
          {/*
          <Link
            href="/legendary/community/chat"
            className={`py-3 text-center ${
              isChat ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            <div className="text-xs font-medium">Chat</div>
          </Link>
          */}
          <Link
            href="/legendary/community/reports"
            className={`py-3 text-center ${
              isReports ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            <div className="text-xs font-medium">Reports</div>
          </Link>
        </div>
      </div>
    </div>
    </CommunityWrapper>
  );
}
