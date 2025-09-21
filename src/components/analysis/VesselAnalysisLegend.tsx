'use client';

interface VesselAnalysisLegendProps {
  vessels: Array<{
    type: string;
    name?: string;
  }>;
}

export default function VesselAnalysisLegend({ vessels }: VesselAnalysisLegendProps) {
  if (!vessels || vessels.length === 0) return null;

  // Count vessels by type
  const vesselCounts = vessels.reduce((acc, vessel) => {
    const type = vessel.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const vesselTypeInfo = {
    longliner: { label: 'Longliner', color: '#FF6B6B' },
    drifting_longline: { label: 'Drifting Longline', color: '#4ECDC4' },
    trawler: { label: 'Trawler', color: '#45B7D1' },
    unknown: { label: 'Other', color: '#95A5A6' }
  };

  return (
    <div className="inline-flex items-center gap-3 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-cyan-500/20 text-xs">
      <span className="text-gray-400 font-medium">Vessels:</span>
      {Object.entries(vesselCounts).map(([type, count]) => {
        const info = vesselTypeInfo[type as keyof typeof vesselTypeInfo] || vesselTypeInfo.unknown;
        return (
          <div key={type} className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: info.color }}
            />
            <span className="text-gray-300">
              {count} {info.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
