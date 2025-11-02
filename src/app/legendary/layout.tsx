import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PaywallGuard from '@/components/auth/PaywallGuard';

export default function LegendaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <PaywallGuard>
        {children}
      </PaywallGuard>
    </ProtectedRoute>
  );
}
