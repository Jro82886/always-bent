'use client';

export default function TrendsPage() {
  return (
    <div className="w-full h-full relative bg-slate-900">
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-cyan-400 mb-2">Fishing Intelligence Hub</h2>
          <p className="text-slate-400">Advanced pattern recognition and predictive analytics</p>
          
          <div className="mt-8 bg-slate-800/50 border border-cyan-500/20 rounded-xl p-6 max-w-xl mx-auto">
            <h3 className="text-white font-bold mb-4">Key Insights</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <p className="text-sm text-slate-300">Best performing days are 2-3 days after a cold front</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <p className="text-sm text-slate-300">68-72°F water temperature shows 40% higher catch rates</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <p className="text-sm text-slate-300">Morning bite shifting 15 min earlier each week</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
