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
      {tabs.map((tab) => {
        const active = activeMode === tab.id;
        
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={[
              "group relative px-6 h-full flex items-center",
              "text-sm font-semibold",
              "transition-all duration-200",
              "hover:bg-cyan-500/10",
              active
                ? "text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                : "text-gray-400 hover:text-cyan-200 focus:text-cyan-200",
            ].join(" ")}
          >
            {/* Larger tap target on mobile without moving layout */}
            <span className="relative z-[1]">{tab.label}</span>

            {/* Animated underline: always mounted; we animate width + opacity */}
            <span
              aria-hidden
              className={[
                "pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-0",
                "h-[2px] rounded-full",
                // gradient + glow for tapered ends
                "bg-gradient-to-r from-transparent via-cyan-400 to-transparent",
                "shadow-[0_0_12px_rgba(34,211,238,0.8),0_0_24px_rgba(34,211,238,0.4)]",
                // animation: width + opacity with very subtle timing
                "transition-[width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                active ? "w-12 opacity-100" : "w-0 opacity-0",
              ].join(" ")}
            />

            {/* Optional: a super-subtle hover shimmer for inactive tabs */}
            {!active && (
              <span
                aria-hidden
                className="absolute inset-x-6 bottom-0 h-px opacity-0 group-hover:opacity-30 transition-opacity duration-150 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}