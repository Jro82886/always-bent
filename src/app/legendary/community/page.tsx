import { redirect } from 'next/navigation';

export default function CommunityPage() {
  // Default to reports tab when visiting /legendary/community
  redirect('/legendary/community/reports');
}
