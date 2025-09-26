'use client';

import { useState, useEffect } from 'react';
import { useAppState } from '@/lib/store';
import { getInletById } from '@/lib/inlets';
import { resolveInlet, getDemoMessage } from '@/lib/inlet';

interface TrendsData {
  tides: { events: Array<{ type: 'high' | 'low'; time: string; height_m: number }> };
  sun: { sunrise: string | null; sunset: string | null };
  bitePrediction: { window: string; byPeriod: Array<{ label: string; pct: number }> } | null;
  communityActivityToday: Array<{ hour: string; count: number }>;
  speciesActivityRange: Array<{ name: string; pct: number }>;
}

export default function TrendsGrid() {
  const { selectedInletId } = useAppState();
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const demoMessage = getDemoMessage();
  
  let inlet = getInletById(selectedInletId);
  if (!inlet) {
    inlet = resolveInlet(null);
  }

  useEffect(() => {
    const fetchTrends = async () => {
      if (!inlet) {
        setLoading(false);
        return;
      }

      try {
        const [lng, lat] = inlet.center;
        const params = new URLSearchParams({
          inlet: inlet.id || '',
          lat: lat.toString(),
          lng: lng.toString(),
          rangeDays: '14'
        });

        const res = await fetch(`/api/trends?${params}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setData(data);
        }
      } catch (error) {
        console.error('Failed to fetch trends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [selectedInletId, inlet]);

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const tides = data?.tides?.events ?? [];
  const bite = data?.bitePrediction ?? null;
  const activity = data?.communityActivityToday ?? [];
  const species = data?.speciesActivityRange ?? [];

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-cyan-300 mb-2">Trends</h2>
        {inlet && (
          <p className="text-sm text-slate-400">
            Live trends for {inlet.name} — built from today's tide feed and recent ABFI bite reports.
          </p>
        )}
        {demoMessage && (
          <div className="text-xs text-cyan-200/60 italic mt-2">
            {demoMessage}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="trends-grid">
        {/* Tide Schedule */}
        <div className="trend-card">
          <h3 className="trend-title">Tide Schedule</h3>
          <div className="trend-card__body">
            {loading ? (
              <div className="trend-empty">
                <span className="text-sm text-slate-400">Loading...</span>
              </div>
            ) : tides.length > 0 ? (
              tides.map((tide, i) => (
                <div key={i} className="trend-row">
                  <span className="text-sm text-slate-300">
                    {tide.type === 'high' ? 'High' : 'Low'} · {formatTime(tide.time)}
                  </span>
                  <span className="text-sm text-slate-400">
                    {tide.height_m.toFixed(1)} m
                  </span>
                </div>
              ))
            ) : (
              <div className="trend-empty">
                <span className="text-sm text-slate-400">
                  No tide data available. This card shows upcoming high and low tides for your inlet once the feed responds for this location.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bite Prediction */}
        <div className="trend-card">
          <h3 className="trend-title">Bite Prediction</h3>
          <div className="trend-card__body">
            {loading ? (
              <div className="trend-empty">
                <span className="text-sm text-slate-400">Loading...</span>
              </div>
            ) : bite ? (
              <>
                <div className="text-sm font-medium text-cyan-300 mb-3">
                  Best window: {bite.window}
                </div>
                {bite.byPeriod.map((period, i) => (
                  <div key={i} className="space-y-1">
                    <div className="trend-row">
                      <span className="text-sm text-slate-300">{period.label}</span>
                      <span className="text-sm text-slate-400">{period.pct}%</span>
                    </div>
                    <div className="trend-bar">
                      <i style={{ width: `${period.pct}%`, background: 'rgba(0,255,255,0.5)' }} />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="trend-empty">
                <span className="text-sm text-slate-400">
                  No prediction yet. This card lights up as the community logs bite reports here. We use recent reports to estimate the best window by time of day.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Today's ABFI Community Activity */}
        <div className="trend-card">
          <h3 className="trend-title">Today's ABFI Community Activity</h3>
          <div className="trend-card__body">
            {loading ? (
              <div className="trend-empty">
                <span className="text-sm text-slate-400">Loading...</span>
              </div>
            ) : activity.length > 0 ? (
              activity.map((hour, i) => (
                <div key={i} className="trend-row">
                  <span className="text-sm text-slate-300">
                    {hour.hour}:00
                  </span>
                  <span className="text-sm text-slate-400">
                    {hour.count} {hour.count === 1 ? 'report' : 'reports'}
                  </span>
                </div>
              ))
            ) : (
              <div className="trend-empty">
                <span className="text-sm text-slate-400">
                  No angler activity yet. As bite reports come in today for this inlet, you'll see hourly activity right here.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ABFI Community Species Activity */}
        <div className="trend-card">
          <h3 className="trend-title">ABFI Community Species Activity</h3>
          <div className="trend-card__body">
            {loading ? (
              <div className="trend-empty">
                <span className="text-sm text-slate-400">Loading...</span>
              </div>
            ) : species.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {species.map((sp, i) => (
                  <div key={i} className="chip">
                    {sp.name} · {sp.pct}%
                  </div>
                ))}
              </div>
            ) : (
              <div className="trend-empty">
                <span className="text-sm text-slate-400">
                  No species data yet. Once anglers tag their bites, this card shows the most active species for this inlet over the last two weeks.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
