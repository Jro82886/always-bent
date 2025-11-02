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

    // Check if user has an active paid plan
    const hasPaidPlan = checkForPaidPlan(member);

    if (!hasPaidPlan) {
      // User is authenticated but doesn't have a paid plan
      // Redirect to pricing page on main site
      console.log('[Paywall] Free user detected, redirecting to pricing');
      window.location.href = 'https://alwaysbentfishingintelligence.com/pricing';
      return;
    }

    // User has paid plan, allow access
    console.log('[Paywall] Paid user verified, granting access');
    setChecking(false);
  }, [member, loading]);

  // Helper function to check if user has a paid plan
  const checkForPaidPlan = (member: any): boolean => {
    // Check planConnections for any ACTIVE paid plans
    if (!member.planConnections || member.planConnections.length === 0) {
      console.log('[Paywall] No plan connections found');
      return false;
    }

    // Check for any active plan connection
    const hasActivePlan = member.planConnections.some((plan: any) => {
      const isActive = plan.status === 'ACTIVE';

      // Log plan details for debugging
      console.log('[Paywall] Plan:', {
        planId: plan.planId,
        status: plan.status,
        priceId: plan.payment?.priceId,
        isActive
      });

      return isActive;
    });

    if (!hasActivePlan) {
      console.log('[Paywall] No active plans found');
      return false;
    }

    // Additional check: ensure it's not a free plan
    // Free plans typically don't have payment info or have a free priceId
    const hasPaidPrice = member.planConnections.some((plan: any) => {
      return plan.status === 'ACTIVE' && plan.payment?.priceId;
    });

    if (!hasPaidPrice) {
      console.log('[Paywall] Active plan found but no paid price ID');
      return false;
    }

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
