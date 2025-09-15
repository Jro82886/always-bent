'use client';

export default function CommunityPage() {
  return (
    <div className="w-full h-full relative bg-slate-900">
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-cyan-400 mb-2">Community Hub</h2>
          <p className="text-slate-400">Share catches, hotspots, and connect with other anglers</p>
          
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-4">
              <div className="text-3xl mb-2">🎣</div>
              <h3 className="text-white font-bold">Catch Reports</h3>
              <p className="text-xs text-slate-400 mt-1">Share your catches</p>
            </div>
            
            <div className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-4">
              <div className="text-3xl mb-2">📍</div>
              <h3 className="text-white font-bold">Hotspots</h3>
              <p className="text-xs text-slate-400 mt-1">Community verified spots</p>
            </div>
            
            <div className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-4">
              <div className="text-3xl mb-2">💬</div>
              <h3 className="text-white font-bold">Messages</h3>
              <p className="text-xs text-slate-400 mt-1">Connect with anglers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
