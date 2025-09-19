import { redirect } from 'next/navigation';

// Force dynamic to handle the redirect
export const dynamic = 'force-dynamic';

export default function CommunityPage() {
  // Default to reports tab when visiting /legendary/community
  redirect('/legendary/community/reports');
}
