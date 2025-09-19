'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import CommunityWrapper from './CommunityWrapper';

// Force dynamic rendering for the entire community section
export const dynamic = 'force-dynamic';

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChat = pathname.includes('/chat');
  const isReports = pathname.includes('/reports');

  return (
    <CommunityWrapper>
      <div className="flex flex-col h-full">
      {/* Desktop Tab Bar */}
      <div className="hidden md:flex bg-slate-900 border-b border-cyan-500/20">
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

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Mobile Bottom Tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-cyan-500/20 z-50">
        <div className="grid grid-cols-2">
          <Link
            href="/legendary/community/chat"
            className={`py-3 text-center ${
              isChat ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            <div className="text-xs font-medium">Chat</div>
          </Link>
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
