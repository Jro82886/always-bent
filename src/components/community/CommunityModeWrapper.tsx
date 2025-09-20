'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CommunityModeWrapper() {
  const router = useRouter();
  
  useEffect(() => {
    // When accessing community mode via ?mode=community,
    // redirect to the actual community route structure
    router.push('/legendary/community/reports');
  }, [router]);
  
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
      <div className="text-cyan-400 animate-pulse">Entering Community...</div>
    </div>
  );
}
