'use client';

import CommunityMode from '@/components/community/CommunityMode';
import PageWithSuspense from '@/components/PageWithSuspense';

export default function CommunityPage() {
  return (
    <PageWithSuspense>
      <CommunityMode />
    </PageWithSuspense>
  );
}