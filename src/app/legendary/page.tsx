// SERVER: decide whether to show app shell or Welcome
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LegendaryShell from '@/components/LegendaryShell'; // whatever renders the tabs/app

export default function LegendaryRoot() {
  const onboarded = cookies().get('abfi_onboarded')?.value === '1';
  if (!onboarded) redirect('/legendary/welcome');   // single server redirect; no blink
  return <LegendaryShell />;
}