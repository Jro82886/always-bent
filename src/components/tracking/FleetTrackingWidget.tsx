'use client';

import { useState } from 'react';
import { Ship, Activity, MapPin, Clock } from 'lucide-react';

export default function FleetTrackingWidget() {
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);

  // Mock fleet data
  const fleetData = [
    { id: '1', name: 'Miss Amanda', status: 'fishing', location: 'Georges Bank', lastUpdate: '2m ago', captain: 'John D.' },
    { id: '2', name: 'Sea Hunter', status: 'transit', location: 'Cape Cod Bay', lastUpdate: '5m ago', captain: 'Mike R.' },
    { id: '3', name: 'Ocean Pride', status: 'docked', location: 'Boston Harbor', lastUpdate: '1h ago', captain: 'Sarah L.' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fishing': return 'text-green-400 bg-green-500/20';
      case 'transit': return 'text-yellow-400 bg-yellow-500/20';
      case 'docked': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Fleet Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-white">3</div>
          <div className="text-xs text-gray-400">Total Fleet</div>
        </div>
        <div className="bg-green-500/10 rounded-lg p-3 text-center border border-green-500/30">
          <div className="text-xl font-bold text-green-400">1</div>
          <div className="text-xs text-green-300">Fishing</div>
        </div>
        <div className="bg-yellow-500/10 rounded-lg p-3 text-center border border-yellow-500/30">
          <div className="text-xl font-bold text-yellow-400">1</div>
          <div className="text-xs text-yellow-300">Transit</div>
        </div>
      </div>

      {/* Fleet List */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Ship className="w-4 h-4" />
          Fleet Status
        </h3>
        
        {fleetData.map((vessel) => (
          <div
            key={vessel.id}
            className={`bg-gray-900/50 rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-800/50 ${
              selectedVessel === vessel.id ? 'ring-2 ring-cyan-500/50' : ''
            }`}
            onClick={() => setSelectedVessel(vessel.id === selectedVessel ? null : vessel.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(vessel.status).split(' ')[1]}`} />
                <div>
                  <p className="text-white font-medium text-sm">{vessel.name}</p>
                  <p className="text-xs text-gray-400">Capt. {vessel.captain}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(vessel.status)}`}>
                  {vessel.status}
                </div>
                <p className="text-xs text-gray-500 mt-1">{vessel.lastUpdate}</p>
              </div>
            </div>

            {selectedVessel === vessel.id && (
              <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span className="text-gray-300">{vessel.location}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-400">Last update: {vessel.lastUpdate}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Activity className="w-3 h-3 text-green-400" />
                  <span className="text-gray-300">GPS Active • AIS Transmitting</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fleet Actions */}
      <div className="flex gap-2">
        <button className="flex-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg px-3 py-2 text-xs font-medium hover:bg-cyan-500/30 transition-colors">
          Send Message
        </button>
        <button className="flex-1 bg-gray-700 text-gray-300 rounded-lg px-3 py-2 text-xs font-medium hover:bg-gray-600 transition-colors">
          View on Map
        </button>
      </div>
    </div>
  );
}
