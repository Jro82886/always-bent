'use client';

import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';

const TABS = [
  { href: '/legendary/analysis', label: 'Analysis' },
  { href: '/legendary/tracking', label: 'Tracking' },
  { href: '/legendary/community', label: 'Community' },
  { href: '/legendary/trends', label: 'Trends' },
];

export function CommandBridgeTabs() {
  const segments = useSelectedLayoutSegments();
  const path = `/${segments.join('/')}`;
  
  return (
    <nav className="cb-tabs">
      {TABS.map(tab => {
        const active = path.startsWith(tab.href);
        return (
          <Link 
            key={tab.href} 
            href={tab.href} 
            className={`cb-tab ${active ? 'is-active' : ''}`}
          >
            {tab.label}
            <span className="cb-underline" />
          </Link>
        );
      })}
    </nav>
  );
}
