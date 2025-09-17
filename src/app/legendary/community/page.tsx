'use client';

import dynamic from 'next/dynamic';

// Dynamically import CommunityMode to ensure complete isolation from map code
const CommunityMode = dynamic(
  () => import('@/components/community/CommunityMode'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading Community...</div>
      </div>
    )
  }
);

export default function CommunityPage() {
  return <CommunityMode />;
}