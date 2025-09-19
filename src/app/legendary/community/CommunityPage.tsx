'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CommunityPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to chat by default
    router.replace('/legendary/community/chat');
  }, [router]);
  
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
      <div className="text-cyan-400 animate-pulse">Loading Community...</div>
    </div>
  );
}
