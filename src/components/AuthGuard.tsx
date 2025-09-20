'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallbackPath?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true,
  fallbackPath = '/legendary?mode=analysis'
}: AuthGuardProps) {
  // DISABLED - No more auth/onboarding checks
  // Always render children immediately
  return <>{children}</>;
}