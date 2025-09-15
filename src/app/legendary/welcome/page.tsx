'use client';

export default function WelcomePage() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="text-center">
        <h1 className="text-5xl font-black text-white mb-4">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            ALWAYS BENT
          </span>
        </h1>
        <p className="text-xl text-cyan-100/90 mb-2">Ocean Intelligence Platform</p>
        <p className="text-sm text-slate-400">Welcome to the future of fishing intelligence</p>
        
        <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl max-w-md mx-auto">
          <p className="text-cyan-400 text-sm">
            Select a mode from the navigation above to get started
          </p>
        </div>
      </div>
    </div>
  );
}
