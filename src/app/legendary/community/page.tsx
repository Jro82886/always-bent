import { Suspense } from 'react';
import CommunityClient from './CommunityClient';

// Force dynamic rendering to avoid useSearchParams SSR issues
export const dynamic = 'force-dynamic';

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading community...</div>
      </div>
    }>
      <CommunityClient />
    </Suspense>
  );
}