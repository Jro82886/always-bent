export function WidgetShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #222', borderRadius: 12, padding: 12 }}>
      <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 8 }}>{title}</div>
      {children ?? <div style={{ opacity: 0.6, fontSize: 12 }}>Coming soon</div>}
    </div>
  );
}


