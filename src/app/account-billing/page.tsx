'use client';

import { useEffect } from 'react';
import { useMemberstack } from '@/lib/memberstack/MemberstackProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AccountBillingPage() {
  const { member, loading, updateProfile } = useMemberstack();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !member) {
      router.push('/login');
    }
  }, [member, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!member) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
          <Link
            href="/legendary"
            className="text-cyan-400 hover:text-cyan-300 text-sm"
          >
            Back to App
          </Link>
        </div>

        <div className="bg-gray-900 rounded-lg shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
          <div className="space-y-3 text-gray-300">
            <div>
              <span className="font-medium">Email:</span> {member.email}
            </div>
            <div>
              <span className="font-medium">Member ID:</span> {member.id}
            </div>
            {member.customFields?.captainName && (
              <div>
                <span className="font-medium">Captain Name:</span> {member.customFields.captainName}
              </div>
            )}
            {member.customFields?.boatName && (
              <div>
                <span className="font-medium">Boat Name:</span> {member.customFields.boatName}
              </div>
            )}
            {member.customFields?.homePort && (
              <div>
                <span className="font-medium">Home Port:</span> {member.customFields.homePort}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Subscription Status</h2>
          <div className="space-y-3 text-gray-300">
            {member.planConnections && member.planConnections.length > 0 ? (
              member.planConnections.map((plan, index) => (
                <div key={index} className="border-b border-gray-700 pb-3 last:border-0">
                  <div>
                    <span className="font-medium">Plan ID:</span> {plan.planId}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      plan.status === 'ACTIVE'
                        ? 'bg-green-900/50 text-green-300'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {plan.status}
                    </span>
                  </div>
                  {plan.payment?.priceId && (
                    <div>
                      <span className="font-medium">Price ID:</span> {plan.payment.priceId}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-gray-400">
                No active subscription. Consider upgrading to access premium features.
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={() => window.open('https://always-bent.memberstack.com/account', '_blank')}
              className="bg-cyan-500 text-black px-4 py-2 rounded hover:bg-cyan-400 transition font-medium"
            >
              Manage Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}