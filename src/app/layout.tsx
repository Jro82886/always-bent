import './globals.css';
import type { Metadata } from 'next';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/styles/abfi-toggle.css';
import { Geist, Geist_Mono } from 'next/font/google';
import GuardsClient from '@/components/GuardsClient';
import BiteSyncInitializer from '@/components/BiteSyncInitializer';
import BetaFeedback from '@/components/BetaFeedback';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'ABFI - Always Bent Fishing Intelligence',
  description: 'Real-time fishing intelligence and bite tracking',
  manifest: '/manifest.json',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#00DDEB',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ABFI'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`min-h-screen w-full bg-gray-950 text-neutral-100 antialiased ${geistSans.variable} ${geistMono.variable}`}
      >
          <GuardsClient />
          <BiteSyncInitializer />
          {children}
          <BetaFeedback />
      </body>
    </html>
  );
}
