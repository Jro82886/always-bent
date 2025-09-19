'use client';

import { Suspense, useEffect, useState } from 'react';

interface ClientBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ClientBoundary - Ensures components using client-side navigation hooks
 * are properly isolated from SSR. This prevents the useSearchParams error
 * while maintaining static optimization for the rest of the app.
 */
export function ClientBoundary({ children, fallback }: ClientBoundaryProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{fallback || null}</>;
  }

  return <Suspense fallback={fallback || <div>Loading...</div>}>{children}</Suspense>;
}

/**
 * withClientBoundary - HOC version for wrapping components
 * Usage: export default withClientBoundary(MyComponent);
 */
export function withClientBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function BoundaryWrapped(props: P) {
    return (
      <ClientBoundary fallback={fallback}>
        <Component {...props} />
      </ClientBoundary>
    );
  };
}
