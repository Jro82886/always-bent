'use client';

import { useState } from 'react';
import { Fish, MapPin, Clock, Anchor, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { SPECIES } from '@/lib/species';

interface FishingReport {
  type: 'bite' | 'catch' | 'sighting' | 'miss';
  species: string;
  location: string;
  time: string;
  depth?: string;
  technique?: string;
  notes?: string;
}

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
    if (!report.species || !report.location) {
      alert('Please fill in species and location');
      return;
    }

    setIsSubmitting(true);
    
    // Save to localStorage for now (will be Supabase later)
    const reports = JSON.parse(localStorage.getItem('abfi_manual_reports') || '[]');
    reports.push({
      ...report,
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
    }, 3000);
    
    setIsSubmitting(false);
  };

  return (
    <div className="h-full flex flex-col bg-black/80 backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-cyan-400">MANUAL REPORT</h2>
          <Fish className="w-5 h-5 text-cyan-400" />
        </div>
        
        {/* Community Impact Message */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-lg p-3 border border-cyan-500/20">
          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 text-cyan-400 mt-0.5" />
            <div>
              <p className="text-xs text-cyan-300 font-semibold mb-1">
                Your Report Powers Community Intelligence
              </p>
              <p className="text-xs text-gray-400">
                Every bite, miss, and sighting helps the fleet learn patterns. 
                Contributing makes everyone smarter and more successful!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Activity Type */}
        <div>
          <label className="text-xs text-cyan-400 font-semibold mb-2 block">WHAT HAPPENED?</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'bite', label: 'Bite', icon: '🎣' },
              { value: 'catch', label: 'Landed', icon: '🐟' },
              { value: 'sighting', label: 'Sighting', icon: '👀' },
              { value: 'miss', label: 'Missed', icon: '❌' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setReport(r => ({ ...r, type: option.value as any }))}
                className={`p-3 rounded-lg border transition-all ${
                  report.type === option.value
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-black/40 border-gray-700 text-gray-400 hover:border-cyan-500/50'
                }`}
              >
                <div className="text-2xl mb-1">{option.icon}</div>
                <div className="text-xs font-semibold">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Species */}
        <div>
          <label className="text-xs text-cyan-400 font-semibold mb-2 block">SPECIES</label>
          <select
            value={report.species}
            onChange={(e) => setReport(r => ({ ...r, species: e.target.value }))}
            className="w-full bg-black/50 border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-400"
          >
            <option value="">Select species...</option>
            <option value="unknown">Unknown/Not Sure</option>
            {SPECIES.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs text-cyan-400 font-semibold mb-2 block">WHERE?</label>
          <input
            type="text"
            value={report.location}
            onChange={(e) => setReport(r => ({ ...r, location: e.target.value }))}
            placeholder="e.g., North Rip, Canyon Edge, Buoy 12..."
            className="w-full bg-black/50 border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Time */}
        <div>
          <label className="text-xs text-cyan-400 font-semibold mb-2 block">WHEN?</label>
          <div className="grid grid-cols-3 gap-2">
            {['now', '30min', '1hr', '2hr', '3hr', 'earlier'].map(time => (
              <button
                key={time}
                onClick={() => setReport(r => ({ ...r, time }))}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  report.time === time
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-black/40 border-gray-700 text-gray-400 hover:border-cyan-500/50'
                }`}
              >
                {time === 'now' ? 'Just Now' : 
                 time === 'earlier' ? 'Earlier Today' : 
                 `${time} ago`}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Details */}
        <div>
          <label className="text-xs text-cyan-400 font-semibold mb-2 block">
            DETAILS (Optional but helpful!)
          </label>
          <textarea
            value={report.notes}
            onChange={(e) => setReport(r => ({ ...r, notes: e.target.value }))}
            placeholder="Depth, bait, technique, conditions..."
            rows={3}
            className="w-full bg-black/50 border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="p-4 border-t border-cyan-500/20">
        {showSuccess ? (
          <div className="bg-green-500/20 border border-green-400 rounded-lg p-3 text-center">
            <p className="text-green-400 font-semibold">✓ Report Submitted!</p>
            <p className="text-xs text-gray-400 mt-1">Thank you for contributing to the fleet intelligence</p>
          </div>
        ) : (
          <>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !report.species || !report.location}
              className="w-full py-3 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-400 text-cyan-300 rounded-lg font-semibold hover:from-cyan-500/30 hover:to-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Submitting...' : 'SUBMIT TO COMMUNITY'}
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-3">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              Personal journal & saved reports coming soon!
            </p>
          </>
        )}
      </div>
    </div>
  );
}
