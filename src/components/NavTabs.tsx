'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAppState } from '@/store/appState';

const TABS = [
  { href: '/imagery',  label: 'Layers' },
  { href: '/analysis', label: 'Analysis' },
  { href: '/tracking', label: 'Tracking' },
  { href: '/community', label: 'Community' },
  { href: '/gfw',      label: 'GFW' },
];

export default function NavTabs() {
  const pathname = usePathname();
  const { username, hydrateOnce, communityBadge, setCommunityBadge } = useAppState();
  useEffect(() => { hydrateOnce(); }, [hydrateOnce]);
  return (
    <div
      className={[
        'absolute z-40',
        'top-3 left-3 md:top-4 md:left-4',
        'pointer-events-auto',
      ].join(' ')}
      style={{
        paddingLeft: 'max(0px, env(safe-area-inset-left))',
        paddingTop: 'max(0px, env(safe-area-inset-top))',
      }}
    >
      <div className="flex items-center gap-2">
        <nav className="flex flex-wrap items-center gap-2 rounded-xl bg-black/35 backdrop-blur-md px-2 py-2 shadow-lg ring-1 ring-white/10">
          {TABS.map((t) => {
            const active = pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={[
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                  active
                    ? 'bg-cyan-400/90 text-black shadow ring-1 ring-cyan-300'
                    : 'text-white/80 hover:text-white hover:bg-white/10',
                ].join(' ')}
              >
                <span className="relative inline-flex items-center">
                  {t.label}
                  {t.href === '/community' && communityBadge && !active && (
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(0,221,235,.8)]" />
                  )}
                </span>
              </Link>
            );
          })}
        </nav>
        {username ? (
          <div className="rounded-lg bg-black/40 px-3 py-1.5 text-xs text-white/85 backdrop-blur ring-1 ring-white/10">
            Hi, <span className="text-cyan-300">{username}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}


