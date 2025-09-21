'use client';

import { INLETS } from '@/lib/inlets';

interface VesselAnalysisLegendProps {
  vessels: Array<{
    type: string;
    vesselType?: string;
    name?: string;
    inlet?: string;
    hasReport?: boolean;
  }>;
}

export default function VesselAnalysisLegend({ vessels }: VesselAnalysisLegendProps) {
  if (!vessels || vessels.length === 0) return null;

  // Separate vessels by category
  const userVessels = vessels.filter(v => v.type === 'user');
  const fleetVessels = vessels.filter(v => v.type === 'fleet');
  const commercialVessels = vessels.filter(v => v.type === 'commercial');

  // Count commercial vessels by type
  const commercialCounts = commercialVessels.reduce((acc, vessel) => {
    const type = vessel.vesselType || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group fleet vessels by inlet
  const fleetByInlet = fleetVessels.reduce((acc, vessel) => {
    const inletId = vessel.inlet || 'unknown';
    if (!acc[inletId]) acc[inletId] = [];
    acc[inletId].push(vessel);
    return acc;
  }, {} as Record<string, typeof fleetVessels>);

  const vesselTypeInfo = {
    longliner: { label: 'Longliner', color: '#FF6B6B' },
    drifting_longline: { label: 'Drifting Longline', color: '#4ECDC4' },
    trawler: { label: 'Trawler', color: '#45B7D1' },
    unknown: { label: 'Other', color: '#95A5A6' }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-lg border border-cyan-500/20 text-xs">
      {/* User vessels */}
      {userVessels.length > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-gray-300">{userVessels.length} Your vessel</span>
        </div>
      )}
      
      {/* Fleet vessels */}
      {Object.entries(fleetByInlet).map(([inletId, inletVessels]) => {
        const inlet = INLETS.find(i => i.id === inletId);
        if (!inlet) return null;
        
        const withReports = inletVessels.filter(v => v.hasReport).length;
        
        return (
          <div key={inletId} className="flex items-center gap-1.5">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: inlet.color }}
            />
            <span className="text-gray-300">
              {inletVessels.length} {inlet.name}
              {withReports > 0 && (
                <span className="text-yellow-400 ml-1">({withReports} reports)</span>
              )}
            </span>
          </div>
        );
      })}
      
      {/* Commercial vessels */}
      {Object.entries(commercialCounts).map(([type, count]) => {
        const info = vesselTypeInfo[type as keyof typeof vesselTypeInfo] || vesselTypeInfo.unknown;
        return (
          <div key={type} className="flex items-center gap-1.5">
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
