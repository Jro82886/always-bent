// src/app/legendary/layout.tsx
import HeaderBar from '@/components/CommandBridge/HeaderBar';

export default function LegendaryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header><HeaderBar /></header>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
