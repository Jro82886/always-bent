import './globals.css';
import type { Metadata } from 'next';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Geist, Geist_Mono } from 'next/font/google';
import GuardsClient from '@/components/GuardsClient';
import BiteSyncInitializer from '@/components/BiteSyncInitializer';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = { title: 'Always Bent (v2 sandbox)' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`h-screen w-screen overflow-hidden bg-gray-950 text-neutral-100 antialiased ${geistSans.variable} ${geistMono.variable}`}
      >
        <GuardsClient />
        <BiteSyncInitializer />
        {children}
      </body>
    </html>
  );
}
