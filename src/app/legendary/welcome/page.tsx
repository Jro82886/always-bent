import WelcomeShell from '@/components/welcome/WelcomeShell';     // your existing markup-only UI
import dynamic from 'next/dynamic';
const WelcomeHydrate = dynamic(() => import('@/components/welcome/WelcomeHydrate'), { ssr: false });

export default function WelcomePage() {
  return (
    <>
      <WelcomeShell />
      <WelcomeHydrate />
    </>
  );
}