'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { MapPin, Users, TrendingUp, Navigation } from 'lucide-react';

const TABS = [
  { id: 'analysis', label: 'Analysis', icon: MapPin, path: '/legendary?mode=analysis' },
  { id: 'tracking', label: 'Tracking', icon: Navigation, path: '/legendary?mode=tracking' },
  { id: 'community', label: 'Community', icon: Users, path: '/legendary?mode=community' },
  { id: 'trends', label: 'Trends', icon: TrendingUp, path: '/legendary?mode=trends' }
];

export default function LegendaryNav() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentMode = searchParams.get('mode') || 'analysis';
  
  const handleTabChange = (tabId: string) => {
    // Don't navigate if already on this tab
    if (currentMode === tabId) return;
    
    // Clean navigation to new mode
    router.push(`/legendary?mode=${tabId}`);
  };
  
  // Only show on legendary pages
  if (!pathname.startsWith('/legendary')) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-black/40 backdrop-blur-md border-b border-cyan-500/20">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = currentMode === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' 
                    : 'bg-black/40 text-gray-400 border border-white/10 hover:border-cyan-500/30 hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>Always Bent Fishing Intelligence</span>
        </div>
      </div>
    </div>
  );
}
