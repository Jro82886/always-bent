'use client';

import { useState, useRef, useEffect } from 'react';
import { Fish, MapPin, Clock, Send, Sparkles, ChevronDown } from 'lucide-react';

interface FishingReport {
  type: 'bite' | 'catch' | 'sighting' | 'miss';
  species: string;
  location: string;
  time: string;
  notes?: string;
}

// Species with colors matching the app style
const ALL_SPECIES = [
  // Offshore
  { id: 'bluefin', name: 'Bluefin Tuna', emoji: '🐟', color: '#3b82f6', category: 'OFFSHORE' },
  { id: 'yellowfin', name: 'Yellowfin Tuna', emoji: '🐠', color: '#fbbf24', category: 'OFFSHORE' },
  { id: 'bigeye', name: 'Bigeye Tuna', emoji: '🐟', color: '#8b5cf6', category: 'OFFSHORE' },
  { id: 'mahi', name: 'Mahi Mahi', emoji: '🐠', color: '#10b981', category: 'OFFSHORE' },
  { id: 'wahoo', name: 'Wahoo', emoji: '🐟', color: '#06b6d4', category: 'OFFSHORE' },
  { id: 'marlin', name: 'Marlin', emoji: '🐟', color: '#6366f1', category: 'OFFSHORE' },
  
  // Inshore
  { id: 'striped-bass', name: 'Striped Bass', emoji: '🐟', color: '#64748b', category: 'INSHORE' },
  { id: 'bluefish', name: 'Bluefish', emoji: '🐟', color: '#0ea5e9', category: 'INSHORE' },
  { id: 'fluke', name: 'Fluke', emoji: '🐟', color: '#a8a29e', category: 'INSHORE' },
  { id: 'seabass', name: 'Sea Bass', emoji: '🐟', color: '#525252', category: 'INSHORE' },
  { id: 'tautog', name: 'Tautog', emoji: '🐟', color: '#78716c', category: 'INSHORE' },
  
  // Other
  { id: 'shark', name: 'Shark', emoji: '🦈', color: '#ef4444', category: 'OTHER' },
  { id: 'unknown', name: 'Unknown/Other', emoji: '❓', color: '#9ca3af', category: 'OTHER' }
];

export default function ReportsPanel() {
  const [report, setReport] = useState<FishingReport>({
    type: 'bite',
    species: '',
    location: '',
    time: 'now',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!report.type) {
      return; // Type is always selected
    }

    setIsSubmitting(true);
    
    // Save to localStorage for now (will be Supabase later)
    const reports = JSON.parse(localStorage.getItem('abfi_manual_reports') || '[]');
    reports.push({
      ...report,
      species: report.species || 'Unknown',
      location: report.location || 'Not specified',
      timestamp: new Date().toISOString(),
      captain: localStorage.getItem('abfi_captain_name') || 'Anonymous',
      boat: localStorage.getItem('abfi_boat_name') || 'Unknown'
    });
    localStorage.setItem('abfi_manual_reports', JSON.stringify(reports));
    
    // Show success message
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      // Reset form
      setReport({
        type: 'bite',
        species: '',
        location: '',
        time: 'now',
        notes: ''
      });
    }, 2000);
    
    setIsSubmitting(false);
  };

  return (
    <div className="h-full flex flex-col bg-black/80 backdrop-blur-md max-w-2xl mx-auto">
      {/* Simplified Header */}
      <div className="p-6 text-center border-b border-cyan-500/10">
        <h2 className="text-xl font-bold text-cyan-400 mb-2">Quick Report</h2>
        <p className="text-sm text-gray-400">Help the fleet by sharing what you saw</p>
      </div>

      {/* Streamlined Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6 max-w-md mx-auto">
          
          {/* Step 1: What happened? - Big friendly buttons */}
          <div className="text-center">
            <p className="text-sm text-cyan-400 mb-3">What happened?</p>
            <div className="flex justify-center gap-3">
              {[
                { value: 'bite', emoji: '🎣' },
                { value: 'catch', emoji: '🐟' },
                { value: 'sighting', emoji: '👀' },
                { value: 'miss', emoji: '❌' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setReport(r => ({ ...r, type: option.value as any }))}
                  className={`p-4 rounded-xl transition-all transform hover:scale-105 ${
                    report.type === option.value
                      ? 'bg-cyan-500/20 border-2 border-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'bg-black/40 border-2 border-gray-700 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="text-3xl">{option.emoji}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Quick species selection */}
          <div className="text-center">
            <p className="text-sm text-cyan-400 mb-3">What species? (optional)</p>
            <div className="grid grid-cols-3 gap-2">
              {ALL_SPECIES.filter(s => ['bluefin', 'yellowfin', 'striped-bass', 'mahi', 'bluefish', 'unknown'].includes(s.id)).map(species => (
                <button
                  key={species.id}
                  onClick={() => setReport(r => ({ ...r, species: species.id }))}
                  className={`p-3 rounded-lg transition-all ${
                    report.species === species.id
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                      : 'bg-black/40 border border-gray-700 text-gray-400 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="text-xl mb-1">{species.emoji}</div>
                  <div className="text-xs">{species.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Simple location (optional) */}
          <div className="text-center">
            <p className="text-sm text-cyan-400 mb-3">Where? (optional)</p>
            <input
              type="text"
              value={report.location}
              onChange={(e) => setReport(r => ({ ...r, location: e.target.value }))}
              placeholder="Location or depth..."
              className="w-full bg-black/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-sm text-cyan-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-center"
            />
          </div>

          {/* Step 4: When - Simplified */}
          <div className="text-center">
            <p className="text-sm text-cyan-400 mb-3">When?</p>
            <div className="flex justify-center gap-2">
              {['now', '1hr', '2hr', 'earlier'].map(time => (
                <button
                  key={time}
                  onClick={() => setReport(r => ({ ...r, time }))}
                  className={`px-4 py-2 rounded-lg text-xs transition-all ${
                    report.time === time
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                      : 'bg-black/40 border border-gray-700 text-gray-400 hover:border-cyan-500/50'
                  }`}
                >
                  {time === 'now' ? 'Just Now' : 
                   time === 'earlier' ? 'Earlier' : 
                   `${time} ago`}
                </button>
              ))}
            </div>
          </div>

          {/* Optional quick note */}
          <div className="text-center">
            <input
              type="text"
              value={report.notes}
              onChange={(e) => setReport(r => ({ ...r, notes: e.target.value }))}
              placeholder="Any quick notes? (optional)"
              className="w-full bg-black/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-sm text-cyan-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-center"
            />
          </div>
        </div>
      </div>

      {/* Simple Submit */}
      <div className="p-6 border-t border-cyan-500/10">
        {showSuccess ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-400 font-semibold">Thanks for sharing!</p>
            <p className="text-xs text-gray-400 mt-1">Your report helps everyone</p>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full max-w-md mx-auto block py-4 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-400/50 text-cyan-300 rounded-xl font-semibold hover:from-cyan-500/30 hover:to-teal-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Sending...' : 'Share with Fleet'}
          </button>
        )}
        
        <p className="text-xs text-gray-500 text-center mt-4">
          <Sparkles className="w-3 h-3 inline mr-1" />
          Every report makes the community smarter
        </p>
      </div>
    </div>
  );
}
