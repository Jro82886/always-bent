"use client";

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// Community entry: decide once and redirect
export default function CommunityPage() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const reportId = params.get('report');
    let last = null as string | null;
    try { last = localStorage.getItem('abfi.community.last'); } catch {}

    const dest = reportId
      ? `/legendary/community/reports?report=${encodeURIComponent(reportId)}`
      : last === 'reports'
        ? '/legendary/community/reports'
        : '/legendary/community/chat';

    router.replace(dest);
  // run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
      <div className="text-cyan-400">Loading community...</div>
    </div>
  );
}
