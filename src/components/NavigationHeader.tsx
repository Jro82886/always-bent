'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import UserBadge from './UserBadge';
import Link from 'next/link';

export default function NavigationHeader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentMode = searchParams.get('mode') || 'analysis';

  const modes = [
    { id: 'analysis', label: 'Analysis', icon: '🎯' },
    { id: 'tracking', label: 'Tracking', icon: '📍' },
    { id: 'community', label: 'Community', icon: '👥' },
    { id: 'trends', label: 'Trends', icon: '📊' },
  ];

  const handleModeChange = (mode: string) => {
    router.push(`/legendary?mode=${mode}`);
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-xl border-b border-cyan-500/20">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo/Brand */}
        <div className="flex items-center gap-6">
          <Link href="/legendary" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900">🎣</span>
            </div>
            <span className="text-lg font-bold text-white hidden sm:block">ABFI</span>
          </Link>

          {/* Mode Navigation */}
          <nav className="flex gap-1">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentMode === mode.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span className="mr-1">{mode.icon}</span>
                <span className="hidden md:inline">{mode.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User Badge */}
        <UserBadge variant="compact" />
      </div>
    </header>
  );
}
