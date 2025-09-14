'use client';

import { useState, useRef, useEffect } from 'react';
import { Fish, MapPin, Clock, Send, Sparkles, ChevronDown, CircleCheck, Eye, X, CircleSlash, CheckCircle2, Anchor, Camera, TrendingUp, Activity } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';

interface FishingReport {
  type: 'bite' | 'catch' | 'sighting' | 'miss';
  species: string;
  location: string;
  time: string;
  notes?: string;
}

interface CatchReport {
  id: string;
  captain: string;
  boatName?: string;
  location: string;
  species: string;
  description: string;
  timestamp: number;
  hasPhoto: boolean;
  inletId?: string;
}

// Species categories - simplified
const ALL_SPECIES = [
  { id: 'tuna', name: 'TUNA', color: '#3b82f6' }, // Blue
  { id: 'meat-fish', name: 'MEAT FISH', color: '#10b981' }, // Emerald
  { id: 'marlin', name: 'MARLIN', color: '#8b5cf6' } // Purple
];

export default function ReportsPanel() {
  const [activeTab, setActiveTab] = useState<'report' | 'recent'>('recent');
  const [report, setReport] = useState<FishingReport>({
    type: 'bite',
    species: '',
    location: '',
    time: 'now',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [recentCatches, setRecentCatches] = useState<CatchReport[]>([]);

  // Load recent catches
  useEffect(() => {
    // Mock data - will be replaced with real data from API
    setRecentCatches([
      {
        id: '1',
        captain: 'Captain Mike',
        boatName: 'Reel Deal',
        location: 'North Rip - 42 fathoms',
        species: 'Striped Bass',
        description: '32" keeper on the troll with umbrella rig. Birds working the area.',
        timestamp: Date.now() - 1000 * 60 * 30,
        hasPhoto: false,
        inletId: 'montauk'
      },
      {
        id: '2',
        captain: 'Sarah',
        boatName: 'Sea Dreams',
        location: 'South Shoal - 28 fathoms',
        species: 'Bluefish',
        description: 'Blitz on bunker schools! Non-stop action for 2 hours.',
        timestamp: Date.now() - 1000 * 60 * 45,
        hasPhoto: false,
        inletId: 'shinnecock'
      },
      {
        id: '3',
        captain: 'Tom Waters',
        boatName: 'Wave Runner',
        location: 'Canyon Edge - 85 fathoms',
        species: 'Yellowfin Tuna',
        description: 'Three YFT 40-60lbs on the chunk. Water temp 72°F, blue water.',
        timestamp: Date.now() - 1000 * 60 * 90,
        hasPhoto: true,
        inletId: 'montauk'
      },
      {
        id: '4',
        captain: 'Big John',
        boatName: 'Tuna Hunter',
        location: 'Fingers - 60 fathoms',
        species: 'Mahi',
        description: 'Found weed line loaded with mahi. Kept 8 nice ones.',
        timestamp: Date.now() - 1000 * 60 * 120,
        hasPhoto: false,
        inletId: 'manasquan'
      },
      {
        id: '5',
        captain: 'Rick',
        boatName: 'Lucky Strike',
        location: 'Inshore Lumps',
        species: 'Fluke',
        description: 'Limits of fluke on the drift. Squid and spearing combo.',
        timestamp: Date.now() - 1000 * 60 * 180,
        hasPhoto: false,
        inletId: 'fire-island'
      }
    ]);
  }, []);

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getInletColor = (inletId?: string) => {
    // This would come from your inlet configuration
    const colors: Record<string, string> = {
      'montauk': '#dc2626',
      'shinnecock': '#ea580c',
      'fire-island': '#f59e0b',
      'manasquan': '#64748b'
    };
    return colors[inletId || ''] || '#00ffff';
  };

  const handleSubmit = async () => {
    if (!report.type) {
      return;
    }

    setIsSubmitting(true);
    
    // Save to localStorage for now (will be Supabase later)
    const reports = JSON.parse(localStorage.getItem('abfi_manual_reports') || '[]');
    const newReport = {
      ...report,
      species: report.species || 'Unknown',
      location: report.location || 'Not specified',
      timestamp: new Date().toISOString(),
      captain: localStorage.getItem('abfi_captain_name') || 'Anonymous',
      boat: localStorage.getItem('abfi_boat_name') || 'Unknown'
    };
    reports.push(newReport);
    localStorage.setItem('abfi_manual_reports', JSON.stringify(reports));
    
    // Add to recent catches display
    setRecentCatches(prev => [{
      id: Date.now().toString(),
      captain: newReport.captain,
      boatName: newReport.boat,
      location: newReport.location,
      species: newReport.species,
      description: `${report.type === 'catch' ? 'Caught' : report.type === 'bite' ? 'Got bite from' : report.type === 'sighting' ? 'Spotted' : 'No luck with'} ${newReport.species}. ${newReport.notes || ''}`,
      timestamp: Date.now(),
      hasPhoto: false,
      inletId: localStorage.getItem('abfi_current_inlet') || undefined
    }, ...prev]);
    
    // Show success message
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      // Reset form and switch to recent tab
      setReport({
        type: 'bite',
        species: '',
        location: '',
        time: 'now',
        notes: ''
      });
      setActiveTab('recent');
    }, 2000);
    
    setIsSubmitting(false);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl">
      {/* Tab Navigation */}
      <div className="p-4 border-b border-purple-500/10">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'recent'
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30 shadow-lg shadow-green-500/20'
                : 'bg-slate-800/50 text-white/60 hover:bg-slate-800/70 hover:text-white/80'
            }`}
          >
            <Activity size={14} className={activeTab === 'recent' ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' : ''} />
            Recent Catches
          </button>
          
          <button
            onClick={() => setActiveTab('report')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'report'
                ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/20'
                : 'bg-slate-800/50 text-white/60 hover:bg-slate-800/70 hover:text-white/80'
            }`}
          >
            <Send size={14} className={activeTab === 'report' ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : ''} />
            Quick Report
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'recent' ? (
        <div className="flex-1 overflow-y-auto p-4">
          {/* Recent Catches Feed */}
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6 text-center">
              <h3 className="text-lg font-bold text-green-300 mb-1">Fleet Activity</h3>
              <p className="text-xs text-green-400/60">Real-time reports from the water</p>
            </div>

            {/* Catch Cards */}
            <div className="space-y-4">
              {recentCatches.map(catchReport => (
                <div key={catchReport.id} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl blur" />
                  <div className="relative bg-gradient-to-r from-slate-800/40 to-transparent rounded-xl p-4 border border-green-500/10 group-hover:border-green-500/30 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-white">{catchReport.captain}</span>
                          
                          {/* ABFI Community Badge */}
                          <div className="flex items-center gap-1.5">
                            <div className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center gap-1" title="ABFI Community Member">
                              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                              <span className="text-[10px] font-bold text-cyan-400">ABFI</span>
                            </div>
                            
                            {/* Inlet Badge */}
                            {catchReport.inletId && (
                              <div 
                                className="px-2 py-0.5 rounded-full flex items-center gap-1.5 border"
                                style={{ 
                                  backgroundColor: `${getInletColor(catchReport.inletId)}15`,
                                  borderColor: `${getInletColor(catchReport.inletId)}40`
                                }}
                                title={`Fishing from ${catchReport.inletId}`}
                              >
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ 
                                    backgroundColor: getInletColor(catchReport.inletId),
                                    boxShadow: `0 0 6px ${getInletColor(catchReport.inletId)}60`
                                  }}
                                />
                                <span className="text-[10px] font-medium text-white/70 uppercase">
                                  {catchReport.inletId.split('-')[0]}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {catchReport.boatName && (
                          <div className="text-sm text-green-400/70 flex items-center gap-1 mt-0.5">
                            <Anchor size={12} />
                            {catchReport.boatName}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-white/50">{formatTime(catchReport.timestamp)}</span>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs font-medium rounded-full border border-green-500/30">
                          {catchReport.species}
                        </span>
                        <div className="text-sm text-white/60 flex items-center gap-1">
                          <MapPin size={12} className="text-green-400/60" />
                          {catchReport.location}
                        </div>
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed">{catchReport.description}</p>
                    </div>
                    
                    {catchReport.hasPhoto && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-green-400">
                        <Camera size={12} />
                        <span>Photo included</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {recentCatches.length === 0 && (
              <div className="text-center py-12">
                <Fish size={48} className="mx-auto text-green-500/20 mb-3" />
                <p className="text-green-400/60">No recent catches reported</p>
                <p className="text-xs text-green-400/40 mt-1">Be the first to share!</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {/* Report Form */}
          <div className="space-y-4 max-w-md mx-auto">
            
            {/* Step 1: What happened? */}
            <div className="text-center">
              <p className="text-xs text-purple-400 mb-2">What happened?</p>
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
              <p className="text-xs text-purple-400 mb-2">What species? (optional)</p>
              <div className="grid grid-cols-3 gap-1.5">
                {ALL_SPECIES.map(species => (
                  <button
                    key={species.id}
                    onClick={() => setReport(r => ({ ...r, species: species.id }))}
                    className={`px-3 py-2 rounded-lg transition-all font-medium text-xs ${
                      report.species === species.id
                        ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400 text-purple-300 shadow-lg shadow-purple-500/20'
                        : 'bg-black/40 border border-gray-700 text-gray-400 hover:border-purple-500/50 hover:text-purple-400'
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

            {/* Step 3: Simple location */}
            <div className="text-center">
              <p className="text-xs text-purple-400 mb-2">Where? (optional)</p>
              <input
                type="text"
                value={report.location}
                onChange={(e) => setReport(r => ({ ...r, location: e.target.value }))}
                placeholder="Location or depth..."
                className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-purple-100 placeholder-gray-500 focus:outline-none focus:border-purple-400 text-center"
              />
            </div>

            {/* Step 4: When */}
            <div className="text-center">
              <p className="text-xs text-purple-400 mb-2">When?</p>
              <div className="flex justify-center gap-1.5">
                {['now', '1hr', '2hr', 'earlier'].map(time => (
                  <button
                    key={time}
                    onClick={() => setReport(r => ({ ...r, time }))}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                      report.time === time
                        ? 'bg-purple-500/20 border border-purple-400 text-purple-300'
                        : 'bg-black/40 border border-gray-700 text-gray-400 hover:border-purple-500/50'
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
                className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-purple-100 placeholder-gray-500 focus:outline-none focus:border-purple-400 text-center"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              {showSuccess ? (
                <div className="text-center py-4">
                  <div className="flex justify-center mb-3">
                    <CheckCircle2 
                      size={48} 
                      className="text-emerald-500/80 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]" 
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-emerald-400/80 font-semibold">Thanks for sharing!</p>
                  <p className="text-xs text-emerald-400/50 mt-1">Your report helps everyone</p>
                </div>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/50 text-purple-300 rounded-xl font-semibold hover:from-purple-500/30 hover:to-indigo-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Sending...' : 'Share with Fleet'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}