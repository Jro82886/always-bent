import React from 'react';

export interface FullBreakdownData {
  version: number;
  snip: {
    id: string;
    inlet: string;
    time_utc: string;
    region_text: string;
    bbox: number[];
    area_sq_mi: number;
  };
  metrics: {
    water_temp_f?: { avg: number; min: number; max: number };
    water_color_summary?: string;
  };
  vessels?: { since_hours: number; gfw_count: number; fleet_count: number; activity_score: number; activity_text: string };
  weather?: { 
    wind?: { speed_kn: number; direction_deg: number };
    swell?: { height_ft: number; period_s: number; direction_deg: number };
  };
  reports?: Array<{ 
    species: string;
    date: string;
    distance_nm?: number;
  }>;
  species_outlook?: { tuna?: string; mahi?: string; billfish?: string };
  hotspot?: { show: boolean; label: string; confidence: 'low'|'medium'|'high' };
  confidence: 'low' | 'medium' | 'high';
  data_gaps: string[];
  ai_readout: string;
}

interface Props {
  data: FullBreakdownData;
  onSave: () => void;
  onSnipAgain: () => void;
  onDone: () => void;
  provenance?: { server_time_utc: string; request_id: string };
}

export default function FullBreakdownCard({ data, onSave, onSnipAgain, onDone, provenance }: Props) {
  return (
    <div className="p-4 rounded-lg bg-neutral-900 text-white space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Analysis Report</h2>
        {data.hotspot?.show && (
          <span className="px-2 py-1 text-sm rounded bg-green-600">
            {data.hotspot.label} ({data.hotspot.confidence})
          </span>
        )}
      </div>

      <section>
        <h3 className="font-semibold">Quick Snapshot</h3>
        <ul className="text-sm space-y-1 mt-1">
          {data.metrics.water_temp_f && (
            <li>
              Temp: {data.metrics.water_temp_f.min}–{data.metrics.water_temp_f.max}°F
              (avg {data.metrics.water_temp_f.avg}°F)
            </li>
          )}
          {data.metrics.water_color_summary && (
            <li>Color: {data.metrics.water_color_summary}</li>
          )}
          <li>Area: {data.snip.area_sq_mi} sq mi</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold">Vessels (last {data.vessels?.since_hours ?? 24}h)</h3>
        {data.vessels ? (
          <ul className="text-sm space-y-1 mt-1">
            <li>Commercial vessels (GFW): {data.vessels.gfw_count || 0}</li>
            <li>Fleet vessels: {data.vessels.fleet_count || 0}</li>
            {(data.vessels.gfw_count > 0 || data.vessels.fleet_count > 0) ? (
              <>
                <li>Activity level: {data.vessels.activity_text}</li>
                {data.vessels.activity_score >= 3 && (
                  <li className="text-green-400">⚡ {data.vessels.activity_text} - fish are likely in the area</li>
                )}
              </>
            ) : (
              <li className="text-neutral-400">No vessels detected in the last {data.vessels.since_hours}h - continuing to monitor for activity</li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-neutral-400 italic">
            Vessel tracking system initializing...
          </p>
        )}
      </section>

      <section>
        <h3 className="font-semibold">Current Conditions</h3>
        {data.weather && (data.weather.wind || data.weather.swell) ? (
          <ul className="text-sm space-y-1 mt-1">
            {data.weather.wind ? (
              <li>Wind: {data.weather.wind.speed_kn}kn from {data.weather.wind.direction_deg}°</li>
            ) : (
              <li className="text-neutral-400">Wind data pending...</li>
            )}
            {data.weather.swell ? (
              <li>Swell: {data.weather.swell.height_ft}ft @ {data.weather.swell.period_s}s from {data.weather.swell.direction_deg}°</li>
            ) : (
              <li className="text-neutral-400">Swell data pending...</li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-neutral-400 italic">
            Weather data integration in progress...
          </p>
        )}
      </section>

      <section>
        <h3 className="font-semibold">Recent Reports (7 days)</h3>
        {data.reports && data.reports.length > 0 ? (
          <ul className="text-sm space-y-1 mt-1">
            {data.reports.map((report, i) => (
              <li key={i} className="text-green-400">
                🎣 {report.species} - {report.date} {report.distance_nm && `(${report.distance_nm}nm away)`}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-400">
            No bite reports in this area yet - be the first to report!
          </p>
        )}
      </section>

      <section>
        <h3 className="font-semibold">What It Means</h3>
        <ul className="list-disc ml-5 text-sm">
          {data.metrics.water_temp_f && (
            <li>
              Water temperature ranges from {data.metrics.water_temp_f.min.toFixed(0)}°F to{' '}
              {data.metrics.water_temp_f.max.toFixed(0)}°F, averaging {data.metrics.water_temp_f.avg.toFixed(0)}°F
              {data.metrics.water_temp_f.max - data.metrics.water_temp_f.min > 2 && ' - significant temperature break detected'}
            </li>
          )}
          {data.metrics.water_color_summary && (
            <li>Water color is {data.metrics.water_color_summary}, indicating {data.metrics.water_color_summary === 'clear blue' ? 'offshore conditions' : data.metrics.water_color_summary === 'green' ? 'nutrient-rich water' : 'transitional zone'}</li>
          )}
          {data.species_outlook && (
            <li>Current conditions favor {Object.entries(data.species_outlook).filter(([_, v]) => v === 'good').map(([k]) => k).join(', ') || 'opportunistic fishing'}</li>
          )}
        </ul>
      </section>

      <section>
        <h3 className="font-semibold">Where To Look</h3>
        <ul className="list-disc ml-5 text-sm">
          {data.metrics.water_temp_f && data.metrics.water_temp_f.max - data.metrics.water_temp_f.min > 2 && (
            <li>Focus on temperature breaks and color changes</li>
          )}
          {data.metrics.water_color_summary === 'mixed' && (
            <li>Work the edges between blue and green water</li>
          )}
          {data.vessels && data.vessels.gfw_count > 0 && (
            <li>Commercial vessels indicate productive areas</li>
          )}
          <li>Check structure and current edges in the area</li>
        </ul>
        <h3 className="font-semibold mt-2">How To Fish</h3>
        <ul className="list-disc ml-5 text-sm">
          {data.metrics.water_temp_f && data.metrics.water_temp_f.avg > 75 && (
            <li>Troll along temperature breaks at varying speeds</li>
          )}
          {data.metrics.water_color_summary === 'clear blue' && (
            <li>Use lighter leaders and natural baits in clear water</li>
          )}
          {data.metrics.water_color_summary === 'green' && (
            <li>Try chunking or live baiting in nutrient-rich areas</li>
          )}
          <li>Work different depths based on thermocline</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold">Species Outlook</h3>
        <ul className="text-sm space-y-1">
          <li>Tuna: {data.species_outlook?.tuna ?? '—'}</li>
          <li>Mahi: {data.species_outlook?.mahi ?? '—'}</li>
          <li>Billfish: {data.species_outlook?.billfish ?? '—'}</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold">Movement (24–72h)</h3>
        <p className="text-sm text-neutral-400">Currents placeholder…</p>
      </section>

      <section>
        <h3 className="font-semibold">AI Read-Out</h3>
        <p className="text-sm">{data.ai_readout}</p>
      </section>

      {data.data_gaps.length > 0 && (
        <section>
          <h3 className="font-semibold">Data Gaps</h3>
          <ul className="list-disc ml-5 text-sm text-yellow-400">
            {data.data_gaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex gap-2 pt-4">
        <button onClick={onSave} className="px-3 py-1 rounded bg-blue-600 text-sm">
          Save Report
        </button>
        <button onClick={onSnipAgain} className="px-3 py-1 rounded bg-neutral-700 text-sm">
          Snip Another Area
        </button>
        <button onClick={onDone} className="px-3 py-1 rounded bg-neutral-700 text-sm">
          Done
        </button>
      </div>

      <div className="pt-4 border-t border-neutral-700">
        <h4 className="text-xs font-semibold text-neutral-400 mb-2">Data Status</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className={data.metrics.water_temp_f ? "text-green-400" : "text-neutral-500"}>
              {data.metrics.water_temp_f ? "●" : "○"} SST
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={data.metrics.water_color_summary ? "text-green-400" : "text-neutral-500"}>
              {data.metrics.water_color_summary ? "●" : "○"} Chlorophyll
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={data.vessels ? "text-green-400" : "text-yellow-400"}>
              {data.vessels ? "●" : "◐"} Vessels
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={data.weather ? "text-yellow-400" : "text-neutral-500"}>
              {data.weather ? "◐" : "○"} Weather
            </span>
          </div>
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          ● Live &nbsp; ◐ Partial &nbsp; ○ Pending
        </p>
      </div>

      {provenance && (
        <div className="pt-2 text-xs text-neutral-500">
          Analysis: {new Date(provenance.server_time_utc).toLocaleTimeString()} • {provenance.request_id?.slice(0, 8)}
        </div>
      )}
    </div>
  );
}


