'use client';

import { useEffect, useState } from 'react';
import { useMemberstack } from '@memberstack/react';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/auth/LogoutButton';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  // @ts-ignore - Memberstack types are incomplete
  const { member, isLoading } = useMemberstack() as any;
  const router = useRouter();
  const [profileData, setProfileData] = useState({
    captainName: '',
    boatName: '',
    homePort: '',
    email: '',
    memberId: '',
    memberSince: '',
    plan: 'Beta Access',
  });

  useEffect(() => {
    if (!isLoading && !member) {
      router.push('/auth/login');
      return;
    }

    if (member) {
      setProfileData({
        captainName: member.customFields?.captainName || localStorage.getItem('abfi_captain_name') || 'Captain',
        boatName: member.customFields?.boatName || localStorage.getItem('abfi_boat_name') || 'Vessel',
        homePort: member.customFields?.homePort || localStorage.getItem('abfi_home_port') || 'Port',
        email: member.auth?.email || '',
        memberId: member.id,
        memberSince: new Date(member.createdAt).toLocaleDateString(),
        plan: member.planConnections?.[0]?.planName || 'Beta Access',
      });
    }
  }, [member, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading profile...</div>
      </div>
    );
  }

  if (!member) return null;

  // Generate initials for avatar
  const initials = profileData.captainName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Captain Profile</h1>
          <button
            onClick={() => router.push('/legendary')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to App
          </button>
        </div>

        {/* Profile Card - The "ID Badge" */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-cyan-500/20 overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600"></div>
          
          {/* Profile Info */}
          <div className="px-8 pb-8">
            {/* Avatar */}
            <div className="-mt-16 mb-6">
              <div className="w-32 h-32 bg-slate-800 rounded-full border-4 border-slate-900 flex items-center justify-center">
                <span className="text-4xl font-bold text-cyan-400">{initials}</span>
              </div>
            </div>

            {/* Captain Info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{profileData.captainName}</h2>
                <p className="text-cyan-400 text-lg">F/V {profileData.boatName}</p>
              </div>

              {/* Details Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Home Port</label>
                    <p className="text-white font-medium">{profileData.homePort}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="text-white font-medium">{profileData.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Member Since</label>
                    <p className="text-white font-medium">{profileData.memberSince}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Subscription</label>
                    <p className="text-white font-medium">{profileData.plan}</p>
                  </div>
                </div>
              </div>

              {/* Member ID Badge */}
              <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-gray-700">
                <label className="text-sm text-gray-500">Member ID</label>
                <p className="text-xs text-gray-400 font-mono mt-1">{profileData.memberId}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => router.push('/legendary/profile/edit')}
                  className="flex-1 py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold rounded-lg transition-all duration-200"
                >
                  Edit Profile
                </button>
                <LogoutButton className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all duration-200 border border-gray-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Stats Card */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Activity Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Reports Shared</span>
                <span className="text-white font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Days Active</span>
                <span className="text-white font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Community Rank</span>
                <span className="text-cyan-400 font-medium">Beta Captain</span>
              </div>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Privacy Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-gray-400">Share Location</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-gray-400">Show in Fleet</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-gray-400">Receive Alerts</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
