'use client';

import dynamic from 'next/dynamic';

const UserBadge = dynamic(() => import('./UserBadge'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-2 text-slate-400">
      <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
    </div>
  ),
});

interface UserBadgeWrapperProps {
  variant?: 'compact' | 'full';
  showBoat?: boolean;
}

export default function UserBadgeWrapper(props: UserBadgeWrapperProps) {
  return <UserBadge {...props} />;
}
