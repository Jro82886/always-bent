import { redirect } from 'next/navigation';

// Redirect to the default tab (Analysis)
// The navigation should use direct routes like /legendary/analysis, /legendary/tracking, etc.
// Not query params like ?mode=analysis
export default function LegendaryPage() {
  redirect('/legendary/analysis');
}