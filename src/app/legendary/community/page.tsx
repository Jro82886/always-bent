'use client';

import { Component, ReactNode } from 'react';
import CommunityMode from '@/components/community/CommunityMode';
import PageWithSuspense from '@/components/PageWithSuspense';

// Error boundary to catch any map-related errors
class CommunityErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log but don't crash
    console.warn('Community page error (likely map-related):', error);
  }

  render() {
    if (this.state.hasError) {
      // Still render the community mode even if there's an error
      return this.props.children;
    }
    return this.props.children;
  }
}

export default function CommunityPage() {
  return (
    <PageWithSuspense>
      <CommunityErrorBoundary>
        <CommunityMode />
      </CommunityErrorBoundary>
    </PageWithSuspense>
  );
}