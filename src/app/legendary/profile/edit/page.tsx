'use client';

import { useEffect, useState } from 'react';
import { useMemberstack } from '@memberstack/react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function EditProfilePage() {
  // @ts-ignore - Memberstack types are incomplete
  const { member, updateMember, isLoading } = useMemberstack() as any;
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    captainName: '',
    boatName: '',
    homePort: '',
  });

  useEffect(() => {
    if (!isLoading && !member) {
      router.push('/auth/login');
      return;
    }

    if (member) {
      setFormData({
        captainName: member.customFields?.captainName || '',
        boatName: member.customFields?.boatName || '',
        homePort: member.customFields?.homePort || '',
      });
    }
  }, [member, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Update Memberstack
      await updateMember({
        customFields: formData,
      });

      // Update localStorage
      localStorage.setItem('abfi_captain_name', formData.captainName);
      localStorage.setItem('abfi_boat_name', formData.boatName);
      localStorage.setItem('abfi_home_port', formData.homePort);

      // Redirect back to profile
      router.push('/legendary/profile');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
          <button
            onClick={() => router.push('/legendary/profile')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Edit Form */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-cyan-500/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="captainName" className="block text-sm font-medium text-gray-300 mb-2">
                Captain Name
              </label>
              <input
                id="captainName"
                name="captainName"
                type="text"
                required
                value={formData.captainName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Captain Smith"
              />
              <p className="mt-1 text-xs text-gray-500">This is how you'll be identified in the community</p>
            </div>

            <div>
              <label htmlFor="boatName" className="block text-sm font-medium text-gray-300 mb-2">
                Boat Name
              </label>
              <input
                id="boatName"
                name="boatName"
                type="text"
                required
                value={formData.boatName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Reel Deal"
              />
              <p className="mt-1 text-xs text-gray-500">Your vessel's name (without F/V prefix)</p>
            </div>

            <div>
              <label htmlFor="homePort" className="block text-sm font-medium text-gray-300 mb-2">
                Home Port
              </label>
              <input
                id="homePort"
                name="homePort"
                type="text"
                required
                value={formData.homePort}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Ocean City, MD"
              />
              <p className="mt-1 text-xs text-gray-500">Your primary port of operation</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/legendary/profile')}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all duration-200 border border-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Additional Settings */}
        <div className="mt-6 bg-slate-900/50 backdrop-blur-xl rounded-lg border border-cyan-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Email Address</p>
              <p className="text-white">{member.auth?.email}</p>
              <p className="text-xs text-gray-500 mt-1">Contact support to change your email</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Member ID</p>
              <p className="text-xs text-gray-400 font-mono">{member.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
