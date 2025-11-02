'use client';

import { useEffect, useState } from 'react';
import { useMemberstack } from '@/lib/memberstack/MemberstackProvider';

export default function PaywallGuard({ children }: { children: React.ReactNode }) {
  const { member, loading } = useMemberstack();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Wait for Memberstack to finish loading
    if (loading) return;

    // Only enforce paywall on production app domain
    const isProductionApp = typeof window !== 'undefined' &&
      window.location.hostname === 'app.alwaysbentfishingintelligence.com';

    // Skip paywall check on localhost and non-production domains
    if (!isProductionApp) {
      setChecking(false);
      return;
    }

    // If no member (not authenticated), let ProtectedRoute handle it
    if (!member) {
      setChecking(false);
      return;
    }

    // Check if user has ANY plan assigned (regardless of price)
    const hasAssignedPlan = checkForAssignedPlan(member);

    if (!hasAssignedPlan) {
      // User is authenticated but has no plan assigned
      // Redirect to pricing page on main site
      console.log('[Paywall] No plan assigned, redirecting to pricing');
      window.location.href = 'https://alwaysbentfishingintelligence.com/pricing';
      return;
    }

    // User has a plan assigned, allow access
    console.log('[Paywall] Plan assigned, granting access');
    setChecking(false);
  }, [member, loading]);

  // Helper function to check if user has any plan assigned
  const checkForAssignedPlan = (member: any): boolean => {
    // Check if user has any plan connections at all
    // Even free plans ($0.00) will have a planConnection entry
    // Only users with NO assigned plans are considered free users
    if (!member.planConnections || member.planConnections.length === 0) {
      console.log('[Paywall] No plan connections found - free user');
      return false;
    }

    // Log plan details for debugging
    member.planConnections.forEach((plan: any) => {
      console.log('[Paywall] Plan assigned:', {
        planId: plan.planId,
        status: plan.status,
        priceId: plan.payment?.priceId
      });
    });

    // User has at least one plan assigned
    console.log('[Paywall] User has assigned plan(s)');
    return true;
  };

  // Show loading state while checking paywall
  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-4">
          <div className="text-cyan-400 text-lg">Verifying subscription...</div>
          <div className="text-gray-500 text-sm">Please wait</div>
        </div>
      </div>
    );
  }

  // User passed paywall check, show content
  return <>{children}</>;
}
