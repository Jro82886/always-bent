'use client';

import TrendsMode from '@/components/trends/TrendsMode';
import PageWithSuspense from '@/components/PageWithSuspense';

export default function TrendsPage() {
  return (
    <PageWithSuspense>
      <TrendsMode />
    </PageWithSuspense>
  );
}