import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function LegendaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
