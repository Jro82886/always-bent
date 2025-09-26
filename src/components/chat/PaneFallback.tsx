'use client';

interface PaneFallbackProps {
  title: string;
}

export default function PaneFallback({ title }: PaneFallbackProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950">
      <div className="text-center space-y-2 p-8">
        <p className="text-lg font-medium text-slate-300">{title}</p>
      </div>
    </div>
  );
}
