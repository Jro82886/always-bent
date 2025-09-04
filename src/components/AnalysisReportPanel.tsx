'use client';

import { useMemo, useRef } from 'react';
import type { AnalysisReport } from '@/types/analysis';

type Props = {
  report: AnalysisReport | null;
  open: boolean;
  onClose: () => void;
};

export default function AnalysisReportPanel({ report, open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const md = useMemo(() => (report?.rawMarkdown ?? ''), [report]);

  const copyText = async () => {
    const text = buildText(report);
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  const downloadText = () => {
    const text = buildText(report);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = report?.isoDate ?? 'report';
    a.download = `abfi-analysis-${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open || !report) return null;

  return (
    <div
      ref={panelRef}
      className="fixed right-4 top-20 z-40 w-[420px] max-h-[70vh] overflow-auto backdrop-blur bg-[color:var(--glass-bg,rgba(20,24,28,.55))] border border-white/10 rounded-xl shadow-xl text-white"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="text-sm uppercase tracking-wide text-white/70">Analysis</div>
        <div className="flex gap-2">
          <button onClick={copyText} className="abfi-btn-secondary text-xs px-2 py-1">Copy</button>
          <button onClick={downloadText} className="abfi-btn-secondary text-xs px-2 py-1">Download</button>
          <button onClick={onClose} className="abfi-btn text-xs px-2 py-1">Close</button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <header>
          <h3 className="text-lg font-semibold">{report.isoDate} • Snip Analysis</h3>
          <p className="text-white/80 text-sm mt-1">BBOX: {report.bbox?.join(', ')}</p>
        </header>

        {report.summary && (
          <p className="text-white/90 leading-relaxed">{report.summary}</p>
        )}

        {report.metrics?.length ? (
          <section>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70 mb-2">Key Metrics</h4>
            <ul className="grid grid-cols-2 gap-2">
              {report.metrics.map((m, i) => (
                <li key={i} className="bg-white/5 rounded-lg px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-white/60">{m.label}</div>
                  <div className="text-sm">{m.value}</div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {report.bullets?.length ? (
          <section>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70 mb-2">Highlights</h4>
            <ul className="list-disc ml-5 space-y-1 text-white/90">
              {report.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </section>
        ) : null}

        {report.recommendations?.length ? (
          <section>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70 mb-2">Recommendations</h4>
            <ol className="list-decimal ml-5 space-y-2">
              {report.recommendations.map((r, i) => (
                <li key={i}>
                  <div className="font-medium">{r.title}</div>
                  {r.rationale && (
                    <div className="text-white/85 text-sm">{r.rationale}</div>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {md && (
          <section>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70 mb-2">Full Text</h4>
            <pre className="whitespace-pre-wrap text-white/90 text-sm bg-white/5 rounded-lg p-3">{md}</pre>
          </section>
        )}
      </div>
    </div>
  );
}

function buildText(r?: AnalysisReport | null): string {
  if (!r) return '';
  const lines: string[] = [];
  lines.push(`ABFI Snip Analysis — ${r.isoDate}`);
  lines.push(`BBOX: ${r.bbox?.join(', ')}`);
  if (r.summary) lines.push(`\n${r.summary}\n`);
  if (r.metrics?.length) {
    lines.push('Key Metrics:');
    r.metrics.forEach(m => lines.push(`- ${m.label}: ${m.value}`));
  }
  if (r.bullets?.length) {
    lines.push('\nHighlights:');
    r.bullets.forEach(b => lines.push(`- ${b}`));
  }
  if (r.recommendations?.length) {
    lines.push('\nRecommendations:');
    r.recommendations.forEach((rec, i) => {
      lines.push(`${i + 1}. ${rec.title}`);
      if (rec.rationale) lines.push(`   • ${rec.rationale}`);
    });
  }
  if (r.rawMarkdown) {
    lines.push('\nFull Text:');
    lines.push(r.rawMarkdown);
  }
  return lines.join('\n');
}


