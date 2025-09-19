'use client';

import Link from 'next/link';

interface TabsProps {
  activeMode: 'analysis' | 'tracking' | 'community' | 'trends';
}

export default function Tabs({ activeMode }: TabsProps) {
  const tabs = [
    { id: 'analysis', label: 'Analysis', href: '/legendary?mode=analysis' },
    { id: 'tracking', label: 'Tracking', href: '/legendary?mode=tracking' },
    { id: 'community', label: 'Community', href: '/legendary?mode=community' },
    { id: 'trends', label: 'Trends', href: '/legendary?mode=trends' }
  ];

  return (
    <div className="flex items-center h-full">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`
            px-6 h-full flex items-center relative
            text-sm font-semibold transition-all
            hover:bg-cyan-500/5
            ${activeMode === tab.id 
              ? 'text-cyan-300' 
              : 'text-gray-400 hover:text-gray-300'
            }
          `}
        >
          {tab.label}
          {activeMode === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          )}
        </Link>
      ))}
    </div>
  );
}
