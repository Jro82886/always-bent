'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/store/appState';

export default function WelcomePage() {
  const router = useRouter();
  const { setUsername } = useAppState();
  const [boatName, setBoatName] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = boatName.trim();
    if (trimmed) {
      // Save boat name to both localStorage keys for compatibility
      localStorage.setItem('abfi_boat_name', trimmed);
      localStorage.setItem('abfi_username', trimmed);
      setUsername(trimmed);
      
      // Navigate to main app
      router.push('/legendary');
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-black flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">Welcome to ABFI</h1>
            <p className="text-slate-300">Always Bent Fishing Intelligence</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="boatName" className="block text-sm font-medium text-slate-300 mb-2">
                Enter Your Boat Name
              </label>
              <input
                type="text"
                id="boatName"
                value={boatName}
                onChange={(e) => setBoatName(e.target.value)}
                placeholder="e.g., Reel Deal"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                autoFocus
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:from-cyan-600 hover:to-blue-600 transform hover:scale-[1.02] transition-all duration-200"
            >
              Start Fishing Intelligence
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-400 text-center">
              Your boat name helps personalize your experience and track your fishing data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}