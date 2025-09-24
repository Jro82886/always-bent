export function buildReadout(opts: {
  sstF?: { mean?: number; min?: number; max?: number };
  chl?: { mean?: number };
}): string {
  const lines: string[] = [];
  const sst = opts.sstF;
  const chl = opts.chl;

  if (sst?.mean != null) {
    lines.push(
      `Sea surface temperature averages ${sst.mean.toFixed(1)}°F` +
        (sst.min != null && sst.max != null
          ? ` (range ${sst.min.toFixed(1)}–${sst.max.toFixed(1)}°F).`
          : '.')
    );
  }
  if (chl?.mean != null) {
    const col = chl.mean <= 0.2 ? 'clear blue' : chl.mean >= 0.8 ? 'green' : 'mixed';
    lines.push(`Water color is ${col} (CHL ~${chl.mean.toFixed(3)} mg/m³).`);
  }
  if (lines.length === 0) {
    lines.push('Live metrics not available; showing template placeholders.');
  }
  lines.push('Target edges and temperature breaks for the highest probability sets.');
  return lines.join(' ');
}


