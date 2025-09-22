export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyan-500/20 rounded-full"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-cyan-400 text-sm font-medium animate-pulse">Loading ocean intelligence...</p>
      </div>
    </div>
  );
}
