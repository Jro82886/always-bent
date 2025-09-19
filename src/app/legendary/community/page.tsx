import { redirect } from 'next/navigation';

// Simple redirect - no dynamic needed

export default function CommunityPage() {
  // Default to reports tab when visiting /legendary/community
  redirect('/legendary/community/reports');
}
