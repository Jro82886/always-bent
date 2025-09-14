export function WidgetShell({ 
  title, 
  children, 
  className = '' 
}: { 
  title: string; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div 
      className={`bg-slate-900/85 backdrop-blur-md border border-slate-700/50 rounded-xl p-3 ${className}`}
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
    >
      <div className="text-white/80 text-xs font-semibold mb-2">{title}</div>
      {children ?? <div className="text-white/60 text-xs">Coming soon</div>}
    </div>
  );
}


