'use client';

import { useEffect, useState } from 'react';
import { useMemberstack } from '@memberstack/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserBadgeProps {
  variant?: 'compact' | 'full';
  showBoat?: boolean;
}

export default function UserBadge({ variant = 'compact', showBoat = true }: UserBadgeProps) {
  const router = useRouter();
  const [userData, setUserData] = useState({
    captainName: '',
    boatName: '',
    initials: '',
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
      </div>
    );
  }

  // Now safe to use hooks
  // @ts-ignore - Memberstack types are incomplete  
  const { member } = useMemberstack() as any;

  useEffect(() => {
    if (member) {
      const captain = member.customFields?.captainName || localStorage.getItem('abfi_captain_name') || 'Captain';
      const boat = member.customFields?.boatName || localStorage.getItem('abfi_boat_name') || 'Vessel';
      
      const initials = captain
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      setUserData({
        captainName: captain,
        boatName: boat,
        initials,
      });
    }
  }, [member]);

  if (!member) return null;

  if (variant === 'compact') {
    return (
      <Link
        href="/legendary/profile"
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
      >
        {/* Mini Avatar */}
        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-cyan-400">{userData.initials}</span>
        </div>
        
        {/* Info */}
        <div className="hidden md:block">
          <p className="text-sm font-medium text-white leading-tight">{userData.captainName}</p>
          {showBoat && (
            <p className="text-xs text-gray-400 leading-tight">F/V {userData.boatName}</p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-cyan-500/20 p-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
          <span className="text-xl font-bold text-cyan-400">{userData.initials}</span>
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-white">{userData.captainName}</h3>
          <p className="text-sm text-cyan-400">F/V {userData.boatName}</p>
          <Link
            href="/legendary/profile"
            className="text-xs text-gray-500 hover:text-gray-400 transition-colors mt-1 inline-block"
          >
            View Profile →
          </Link>
        </div>
      </div>
    </div>
  );
}
