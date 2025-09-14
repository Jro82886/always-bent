'use client';

import { useState, useRef, useEffect } from 'react';
import { Fish, MapPin, Clock, Send, Sparkles, ChevronDown, CircleCheck, Eye, X, CircleSlash } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';

interface FishingReport {
  type: 'bite' | 'catch' | 'sighting' | 'miss';
  species: string;
  location: string;
  time: string;
  notes?: string;
}

// Species categories - simplified
const ALL_SPECIES = [
  { id: 'tuna', name: 'TUNA', color: '#3b82f6' }, // Blue
  { id: 'meat-fish', name: 'MEAT FISH', color: '#10b981' }, // Emerald
  { id: 'marlin', name: 'MARLIN', color: '#8b5cf6' } // Purple
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
      <div className="p-4 text-center border-b border-cyan-500/10">
        <h2 className="text-lg font-bold text-cyan-400 mb-1">Quick Report</h2>
        <p className="text-xs text-gray-400">Help the fleet by sharing what you saw</p>
      </div>

      {/* Streamlined Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4 max-w-md mx-auto">
          
          {/* Step 1: What happened? - Compact buttons */}
          <div className="text-center">
            <p className="text-xs text-cyan-400 mb-2">What happened?</p>
            <div className="flex justify-center gap-2">
              {[
                { 
                  value: 'catch', 
                  icon: Fish, 
                  color: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]',
                  tooltip: 'Caught fish'
                },
                { 
                  value: 'bite', 
                  icon: CircleCheck, 
                  color: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]',
                  tooltip: 'Got a bite'
                },
                { 
                  value: 'sighting', 
                  icon: Eye, 
                  color: 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]',
                  tooltip: 'Saw activity'
                },
                { 
                  value: 'miss', 
                  icon: X, 
                  color: 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]',
                  tooltip: 'No luck'
                }
              ].map(option => (
                <Tooltip key={option.value} text={option.tooltip} position="bottom">
                  <button
                    onClick={() => setReport(r => ({ ...r, type: option.value as any }))}
                    className={`p-3 rounded-lg transition-all transform hover:scale-105 ${
                      report.type === option.value
                        ? 'bg-purple-500/20 border-2 border-purple-400 shadow-lg shadow-purple-500/20'
                        : 'bg-black/40 border-2 border-gray-700 hover:border-purple-500/50'
                    }`}
                  >
                    <option.icon size={24} className={option.color} />
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Step 2: Quick species selection */}
          <div className="text-center">
            <p className="text-xs text-cyan-400 mb-2">What species? (optional)</p>
            <div className="grid grid-cols-3 gap-1.5">
              {ALL_SPECIES.map(species => (
                <button
                  key={species.id}
                  onClick={() => setReport(r => ({ ...r, species: species.id }))}
                  className={`px-3 py-2 rounded-lg transition-all font-medium text-xs ${
                    report.species === species.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                      : 'bg-black/40 border border-gray-700 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400'
                  }`}
                  style={{
                    borderColor: report.species === species.id ? species.color : undefined,
                    boxShadow: report.species === species.id ? `0 0 20px ${species.color}40` : undefined
                  }}
                >
                  {species.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Simple location (optional) */}
          <div className="text-center">
            <p className="text-xs text-cyan-400 mb-2">Where? (optional)</p>
            <input
              type="text"
              value={report.location}
              onChange={(e) => setReport(r => ({ ...r, location: e.target.value }))}
              placeholder="Location or depth..."
              className="w-full bg-black/50 border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-cyan-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-center"
            />
          </div>

          {/* Step 4: When - Simplified */}
          <div className="text-center">
            <p className="text-xs text-cyan-400 mb-2">When?</p>
            <div className="flex justify-center gap-1.5">
              {['now', '1hr', '2hr', 'earlier'].map(time => (
                <button
                  key={time}
                  onClick={() => setReport(r => ({ ...r, time }))}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
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
              className="w-full bg-black/50 border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-cyan-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-center"
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
