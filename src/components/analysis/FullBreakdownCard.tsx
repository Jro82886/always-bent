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

      {(() => {
        const v = data.vessels;
        if (!v) return null;
        const show = (v.gfw_count ?? 0) > 0 || (v.fleet_count ?? 0) > 0 || v.activity_text;
        if (!show) return null;
        return (
          <section>
            <h3 className="font-semibold">Vessels (last {v.since_hours ?? 24}h)</h3>
            <ul className="text-sm space-y-1 mt-1">
              <li>GFW vessels: {v.gfw_count ?? 0}</li>
              <li>Fleet vessels: {v.fleet_count ?? 0}</li>
              <li>Activity: {v.activity_text || 'n/a'}</li>
            </ul>
          </section>
        );
      })()}

      <section>
        <h3 className="font-semibold">What It Means</h3>
        <ul className="list-disc ml-5 text-sm">
          <li>Interpret SST and CHL values in plain language.</li>
          <li>Note if break/edge is present.</li>
          <li>Add simple guidance lines.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold">Where To Look</h3>
        <ul className="list-disc ml-5 text-sm">
          <li>Short bullet #1</li>
          <li>Short bullet #2</li>
          <li>Short bullet #3</li>
        </ul>
        <h3 className="font-semibold mt-2">How To Fish</h3>
        <ul className="list-disc ml-5 text-sm">
          <li>Short bullet #1</li>
          <li>Short bullet #2</li>
          <li>Short bullet #3</li>
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

      {provenance && (
        <div className="pt-2 text-xs text-neutral-500">
          Data: live • {provenance.server_time_utc} • req {provenance.request_id?.slice(0, 8)}
        </div>
      )}
    </div>
  );
}


