'use client';

import { useMemo, useState } from 'react';

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="panel-glass" style={{ borderRadius: 12, padding: 12, marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--abfi-muted)' }}>{title}</div>
        <button
          className="btn"
          onClick={() => navigator.clipboard.writeText(code)}
          title="Copy to clipboard"
        >Copy</button>
      </div>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, color: 'var(--abfi-text)' }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(148,163,184,0.35)', background: value }} />
      <div style={{ fontSize: 12, color: 'var(--abfi-text)' }}>{name}</div>
      <div style={{ fontSize: 12, color: 'var(--abfi-muted)' }}>{value}</div>
    </div>
  );
}

export default function StyleguidePage() {
  const [panelOpacity, setPanelOpacity] = useState(0.78);
  const [accentGlow, setAccentGlow] = useState(0.35);
  const [reveal, setReveal] = useState(0.5);

  const panelStyle = useMemo(() => ({
    background: `rgba(16,19,28,${panelOpacity.toFixed(2)})`,
  }), [panelOpacity]);

  return (
    <div style={{ padding: 24, background: '#030712', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Style Guide</h1>
      <p style={{ color: 'var(--abfi-muted)', marginBottom: 18 }}>Tokens and primitives for a sleek, modern, intuitive UI.</p>

      <section className="panel-glass" style={{ borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Design Tokens</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <Swatch name="Panel" value="var(--abfi-panel)" />
          <Swatch name="Border" value="var(--abfi-border)" />
          <Swatch name="Text" value="#E5E7EB" />
          <Swatch name="Muted" value="#94A3B8" />
          <Swatch name="Accent" value="#00DDEB" />
        </div>
      </section>

      <section className="panel-glass" style={{ borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Buttons</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn">Default</button>
          <button className="btn btn-primary" style={{ boxShadow: `0 0 24px rgba(0,221,235,${accentGlow})` }}>Primary</button>
          <button className="btn" disabled aria-disabled>Disabled</button>
        </div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '120px 1fr 40px', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--abfi-muted)' }}>Primary glow</label>
          <input type="range" min={0} max={0.6} step={0.01} value={accentGlow} onChange={(e) => setAccentGlow(parseFloat(e.target.value))} />
          <span style={{ fontSize: 12, color: 'var(--abfi-muted)', textAlign: 'right' }}>{Math.round(accentGlow * 100)}%</span>
        </div>
      </section>

      <section className="panel-glass" style={{ borderRadius: 12, padding: 16, marginBottom: 16, ...panelStyle }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Panels</div>
        <p style={{ fontSize: 13, color: 'var(--abfi-text)' }}>Glass with blur, soft borders, and subtle depth.</p>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '120px 1fr 40px', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--abfi-muted)' }}>Panel opacity</label>
          <input type="range" min={0.5} max={0.95} step={0.01} value={panelOpacity} onChange={(e) => setPanelOpacity(parseFloat(e.target.value))} />
          <span style={{ fontSize: 12, color: 'var(--abfi-muted)', textAlign: 'right' }}>{Math.round(panelOpacity * 100)}%</span>
        </div>
      </section>

      <section className="panel-glass" style={{ borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Map Legend (Preview)</div>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div
            style={{
              position: 'relative',
              padding: '10px 12px',
              borderRadius: 12,
              background: 'var(--abfi-panel)',
              border: '1px solid var(--abfi-border)',
              color: 'var(--abfi-text)'
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: 0.3, color: 'var(--abfi-muted)', marginBottom: 6 }}>SST Features</div>
            {[{k:'edge', l:'Edge', f:'#F59E0B', s:'#F59E0B'},{k:'filament', l:'Filament', f:'#00DDEB', s:'#06B6D4'},{k:'eddy', l:'Eddy', f:'#E879F9', s:'#D946EF'}].map(item => (
              <div key={item.k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span aria-hidden style={{ width: 14, height: 14, borderRadius: 3, background: item.f, border: `1px solid ${item.s}` }} />
                <span style={{ fontSize: 12 }}>{item.l}</span>
              </div>
            ))}
          </div>
        </div>
        <CodeBlock
          title="Legend example"
          code={`function Legend() {
  const items = [
    { key: 'edge', label: 'Edge', fill: '#F59E0B', stroke: '#F59E0B' },
    { key: 'filament', label: 'Filament', fill: '#00DDEB', stroke: '#06B6D4' },
    { key: 'eddy', label: 'Eddy', fill: '#E879F9', stroke: '#D946EF' }
  ];
  return (
    <div className="panel-glass" style={{ padding: 12, borderRadius: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--abfi-muted)', marginBottom: 6 }}>SST Features</div>
      {items.map(i => (
        <div key={i.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span aria-hidden style={{ width: 14, height: 14, borderRadius: 3, background: i.fill, border: '1px solid ' + i.stroke }} />
          <span style={{ fontSize: 12 }}>{i.label}</span>
        </div>
      ))}
    </div>
  );
}`}
        />
      </section>

      <section className="panel-glass" style={{ borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Opacity Control (Preview)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 40px', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--abfi-muted)' }}>Reveal</label>
          <input type="range" min={0} max={1} step={0.01} value={reveal} onChange={(e) => setReveal(parseFloat(e.target.value))} />
          <span style={{ fontSize: 12, color: 'var(--abfi-muted)', textAlign: 'right' }}>{Math.round(reveal * 100)}%</span>
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: 520, aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--abfi-border)' }}>
          {/* Base raster mock */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #f59e0b, #fb7185)' , opacity: 1 - 0.45 * reveal }} />
          {/* Overlays mock */}
          <svg viewBox="0 0 100 56" style={{ position: 'absolute', inset: 0, opacity: reveal }}>
            <path d="M2,40 L30,20 L55,26 L96,8" fill="none" stroke="#D946EF" strokeWidth="1.5" />
            <path d="M8,44 L26,28 L62,36 L88,20" fill="none" stroke="#06B6D4" strokeWidth="1.5" />
            <rect x="60" y="14" width="18" height="12" fill="#F59E0B22" stroke="#F59E0B" />
          </svg>
        </div>
        <CodeBlock
          title="Reveal wiring (concept)"
          code={`// Multiply overlay opacities by 'reveal' and dim raster toward a target
const RASTER_TARGET_AT_FULL = 0.55;
function applyRasterDim(map, reveal) {
  const mult = 1 - (1 - RASTER_TARGET_AT_FULL) * Math.max(0, Math.min(1, reveal));
  map.setPaintProperty('lyr:sst', 'raster-opacity', ['*', ['coalesce', ['get','raster-opacity'], 1], mult]);
}`}
        />
      </section>

      <section className="panel-glass" style={{ borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Usage Notes</div>
        <ul style={{ fontSize: 13, color: 'var(--abfi-muted)', lineHeight: 1.6 }}>
          <li>Keep hit targets ≥44px on touch devices.</li>
          <li>Use one primary action per panel; ghost buttons for secondary actions.</li>
          <li>Prefer subtle motion (150–250ms). Respect reduce‑motion.</li>
          <li>Ensure keyboard focus rings are always visible.</li>
        </ul>
      </section>
    </div>
  );
}


