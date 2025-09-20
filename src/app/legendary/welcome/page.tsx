'use client';

import dynamic from 'next/dynamic';

// Use the enhanced welcome with mode selection
const EnhancedWelcome = dynamic(() => import('./EnhancedWelcome'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-cyan-400">Loading...</div>
    </div>
  )
});

export default function LegendaryWelcomePage() {
  return <EnhancedWelcome />;
}