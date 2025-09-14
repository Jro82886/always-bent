'use client';

import { useState } from 'react';
import { Anchor, Ship, Truck, Users, Filter } from 'lucide-react';

export default function CommercialTrackingWidget() {
  const [filter, setFilter] = useState<string>('all');

  // Mock AIS data
  const vessels = [
    { id: '1', name: 'ATLANTIC STAR', type: 'Cargo', mmsi: '367123456', speed: '12.3 kts', heading: '045°', status: 'Under way' },
    { id: '2', name: 'BOSTON PILOT', type: 'Pilot', mmsi: '367789012', speed: '8.1 kts', heading: '180°', status: 'Engaged' },
    { id: '3', name: 'FREEDOM', type: 'Fishing', mmsi: '367345678', speed: '4.5 kts', heading: '270°', status: 'Fishing' },
    { id: '4', name: 'CAPE ANN', type: 'Tanker', mmsi: '367901234', speed: '0.0 kts', heading: '000°', status: 'Anchored' },
  ];

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cargo': return <Truck className="w-3 h-3" />;
      case 'fishing': return <Anchor className="w-3 h-3" />;
      default: return <Ship className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'under way': return 'text-green-400';
      case 'fishing': return 'text-yellow-400';
      case 'anchored': return 'text-gray-400';
      case 'engaged': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const filteredVessels = filter === 'all' 
    ? vessels 
    : vessels.filter(v => v.type.toLowerCase() === filter);

  return (
    <div className="space-y-4">
      {/* Traffic Overview */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Area Traffic</h3>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-purple-400">156</div>
            <div className="text-xs text-gray-400">vessels in range</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <div className="text-white font-semibold">42</div>
            <div className="text-gray-400">Cargo</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">38</div>
            <div className="text-gray-400">Fishing</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">28</div>
            <div className="text-gray-400">Tanker</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">48</div>
            <div className="text-gray-400">Other</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:border-cyan-500 focus:outline-none"
        >
          <option value="all">All Vessels</option>
          <option value="cargo">Cargo Ships</option>
          <option value="fishing">Fishing Vessels</option>
          <option value="tanker">Tankers</option>
          <option value="pilot">Pilot Boats</option>
        </select>
      </div>

      {/* Vessel List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {filteredVessels.map((vessel) => (
          <div key={vessel.id} className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <div className="text-purple-400 mt-0.5">
                  {getTypeIcon(vessel.type)}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{vessel.name}</p>
                  <p className="text-xs text-gray-400">MMSI: {vessel.mmsi}</p>
                  <p className="text-xs text-gray-500">{vessel.type}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-xs font-medium ${getStatusColor(vessel.status)}`}>
                  {vessel.status}
                </div>
                <p className="text-xs text-gray-400 mt-1">{vessel.speed}</p>
                <p className="text-xs text-gray-500">{vessel.heading}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AIS Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          📡 AIS data updated every 30 seconds. Range: 25 nautical miles.
        </p>
      </div>
    </div>
  );
}
