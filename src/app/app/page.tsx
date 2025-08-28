"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/store/appState";
import { AnalysisMap } from "@/components/AnalysisMap";
import { LeftRail } from "@/components/LeftRail";
import { TopBar } from "@/components/TopBar";
import * as Tooltip from "@radix-ui/react-tooltip";

function MapPlaceholder() {
  return <div className="flex-1 bg-slate-100 dark:bg-slate-900 grid place-items-center">Map</div>;
}

// Imagery tab removed per refactor

function Chip({ active, disabled, onClick, children, tooltip }: { active?: boolean; disabled?: boolean; onClick?: () => void; children: React.ReactNode; tooltip?: string }) {
  const base = "px-2 py-1 rounded text-sm border";
  const cls = disabled
    ? `${base} opacity-50 cursor-not-allowed`
    : active
    ? `${base} bg-cyan-600 text-white border-cyan-600`
    : `${base} hover:bg-cyan-50 dark:hover:bg-cyan-950 border-cyan-600/40 text-cyan-700 dark:text-cyan-300`;
  const el = (
    <button disabled={disabled} onClick={onClick} className={cls}>
      {children}
    </button>
  );
  if (disabled && tooltip) {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{el}</Tooltip.Trigger>
        <Tooltip.Content className="bg-black text-white text-xs rounded px-2 py-1">{tooltip}</Tooltip.Content>
      </Tooltip.Root>
    );
  }
  return el;
}

function AnalysisTab() {
  const { inletId, selectedDate, setSelectedDate, activeLayer, setActiveLayer, bbox, setBbox } = useAppState();
  const { analysis, setAnalysis, clearAnalysisView, analysisText, setAnalysisText } = (useAppState as any)?.() ?? {};
  const [zoomKey, setZoomKey] = useState(0);

  // When date or active layer changes, trigger placeholder overlay loader
  useEffect(() => {
    if (!activeLayer) return;
    if (!selectedDate) return;
    console.log(`loading ${activeLayer} for ${selectedDate}`);
  }, [activeLayer, selectedDate]);

  const canAnalyze = Boolean(selectedDate && activeLayer && bbox);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analyze = async () => {
    if (!canAnalyze) return;
    setError(null);
    setLoading(true);
    setZoomKey((k) => k + 1);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inletId, bbox, date: selectedDate, layer: activeLayer }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      if (typeof setAnalysis === "function") {
        setAnalysis({ features: data.features, summary: data.summary });
      } else if (typeof setAnalysisText === "function") {
        setAnalysisText(data.summary || "");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to analyze");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col">
      <div className="h-12 border-b flex items-center gap-3 px-3">
        <Tooltip.Provider delayDuration={0}>
          <button className="text-sm text-cyan-700 dark:text-cyan-300 hover:underline" onClick={() => clearAnalysisView?.()}>Back to Home</button>
          <div className="ml-4 flex items-center gap-2">
            <label className="text-sm opacity-80">Date</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border rounded px-2 py-1 text-sm" />
          </div>
          <div className="ml-6 flex items-center gap-2">
            <Chip active={activeLayer === "sst"} onClick={() => setActiveLayer(activeLayer === "sst" ? null : "sst")}>SST</Chip>
            <Chip
              active={activeLayer === "chlorophyll"}
              onClick={() => setActiveLayer(activeLayer === "chlorophyll" ? null : "chlorophyll")}
            >
              Chlorophyll
            </Chip>
            <Chip disabled tooltip="Coming soon">Wind</Chip>
            <Chip disabled tooltip="Coming soon">Currents</Chip>
            <Chip disabled tooltip="Coming soon">Salinity</Chip>
            <Chip disabled tooltip="Coming soon">Waves</Chip>
          </div>
          <div className="ml-auto text-xs opacity-70">
            {bbox ? `bbox: ${bbox.map((n) => n.toFixed(2)).join(", ")}` : "Drag to snip a rectangle"}
          </div>
        </Tooltip.Provider>
      </div>
      <div className="flex-1">
        <AnalysisMap zoomKey={zoomKey} />
      </div>
      <div className="absolute left-0 right-0 bottom-0 p-3">
        <div className="max-w-3xl mx-auto rounded border bg-white/80 dark:bg-black/60 backdrop-blur p-3">
          <div className="text-sm font-semibold mb-1">Summary</div>
          <div className="text-sm opacity-90 whitespace-pre-wrap min-h-6">{(analysis?.summary ?? analysisText ?? "Run Analyze to generate a summary.")}</div>
        </div>
      </div>
      <div className="absolute bottom-24 right-6">
        <button disabled={!canAnalyze || loading} onClick={analyze} className="bg-cyan-600 disabled:opacity-40 text-white rounded-full px-5 py-2 shadow-lg min-w-28">
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>
      {/* Summary panel */}
      <div className="mt-3 rounded-md border border-white/10 bg-black/30 p-3">
        <div className="text-xs uppercase tracking-wide text-white/50">Summary</div>
        <p className="mt-2 text-sm leading-relaxed">
          {analysis?.summary ?? analysisText ?? "Run Analyze to generate a summary."}
        </p>
      </div>
      {error ? (
        <div className="fixed right-4 top-4 bg-red-600 text-white text-sm rounded shadow px-3 py-2" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}

// Community route will have its own page

// GFW route will have its own page

export default function AppPage() {
  useEffect(() => {}, []);
  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr]">
      <TopBar />
      <div className="grid grid-cols-[56px_1fr]">
        <LeftRail />
        <div className="ml-14">{/* account for fixed aside width */}
          <AnalysisTab />
        </div>
      </div>
    </div>
  );
}


