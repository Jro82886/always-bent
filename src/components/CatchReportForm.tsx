"use client";
import { useState, useEffect } from 'react';
import { X, Check, MapPin, Thermometer, Wind, Fish, Target, Eye, Sparkles, Activity, Anchor } from 'lucide-react';
import type mapboxgl from 'mapbox-gl';

interface CatchReportFormProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  map: mapboxgl.Map | null;
  location: { lat: number; lng: number } | null;
}

export default function CatchReportForm({ visible, onClose, onConfirm, map, location }: CatchReportFormProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState({
    boatName: '',
    inlet: '',
    activityType: 'bite', // 'bite', 'landed', 'spotted', 'feeding'
    species: '',
    quantity: 1,
    notes: '',
    waterTemp: 0,
    waterColor: 'blue',
    depth: 0,
    timeOfDay: '',
    layersActive: {
      sst: false,
      chl: false,
      ocean: false
    }
  });

  useEffect(() => {
    if (visible) {
      // Prefill data
      const boatName = localStorage.getItem('abfi_boat_name') || '';
      const inlet = localStorage.getItem('abfi_current_inlet') || '';
      const hour = new Date().getHours();
      const timeOfDay = hour < 6 ? 'Night' : hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
      
      // Get current layer states from map
      const sstActive = map?.getLayer('sst-lyr') && 
                       map.getLayoutProperty('sst-lyr', 'visibility') === 'visible';
      const chlActive = map?.getLayer('chl-lyr') && 
                       map.getLayoutProperty('chl-lyr', 'visibility') === 'visible';
      const oceanActive = map?.getLayer('ocean-layer') && 
                         map.getLayoutProperty('ocean-layer', 'visibility') === 'visible';
      
      setFormData(prev => ({
        ...prev,
        boatName,
        inlet,
        timeOfDay,
        waterTemp: Math.floor(68 + Math.random() * 12), // Mock temp 68-80°F (typical East Coast range)
        layersActive: {
          sst: sstActive || false,
          chl: chlActive || false,
          ocean: oceanActive || false
        }
      }));
      
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [visible, map]);

  const handleConfirm = () => {
    // Check if we're in test mode
    const isTestMode = process.env.NODE_ENV === 'development' || 
                      window.location.hostname === 'localhost' ||
                      localStorage.getItem('abfi_test_mode') === 'true';
    
    // Add location to form data with test flag
    const finalData = {
      ...formData,
      location,
      timestamp: new Date().toISOString(),
      is_test_data: isTestMode,
      data_source: isTestMode ? 'test' : 'production'
    };
    
    // Save to localStorage with test data segregation
    const storageKey = isTestMode ? 'abfi_test_catches' : 'abfi_catches';
    const catches = JSON.parse(localStorage.getItem(storageKey) || '[]');
    catches.push(finalData);
    localStorage.setItem(storageKey, JSON.stringify(catches));
    
    if (isTestMode) {
      // Test mode enabled
    }
    
    onConfirm(finalData);
    onClose();
  };

  if (!visible) return null;

  return (
    <>
      {/* Dark overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Activity Animation */}
      <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${
        isAnimating ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      }`}>
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-full shadow-2xl">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Activity size={24} className="animate-pulse" />
            Fish Activity Detected!
            <Fish size={24} className="animate-pulse" />
          </h2>
        </div>
      </div>
      
      {/* Form Modal */}
      <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-500 ${
        isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-2xl shadow-2xl border border-cyan-500/30 max-w-lg w-full">
          {/* Header */}
          <div className="p-6 border-b border-cyan-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Fish className="text-cyan-400" />
                Log Fish Activity
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Prefilled Data Display */}
          <div className="p-6 space-y-4">
            {/* Location & Conditions */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 space-y-3">
              <h4 className="text-cyan-300 font-semibold mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-cyan-400" />
                Conditions (Auto-filled)
              </h4>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-cyan-400" />
                  <span className="text-gray-300">
                    {location ? `${location.lat.toFixed(4)}°N, ${Math.abs(location.lng).toFixed(4)}°W` : 'Getting location...'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Thermometer size={16} className="text-orange-400" />
                  <span className="text-gray-300">{formData.waterTemp}°F</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-300">
                  <Wind size={16} className="text-blue-400" />
                  <span>{formData.timeOfDay}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-300">
                  <Anchor size={16} className="text-gray-400" />
                  <span>{formData.boatName || 'Unknown Boat'}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-2">
                {formData.layersActive.sst && (
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs">
                    SST Active
                  </span>
                )}
                {formData.layersActive.chl && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                    CHL Active
                  </span>
                )}
                {formData.layersActive.ocean && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                    Ocean Active
                  </span>
                )}
              </div>
            </div>
            
            {/* Activity Type Selector - IMPORTANT! */}
            <div className="mb-4">
              <label className="text-sm text-cyan-300 font-semibold block mb-2">What happened? (All data helps!)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, activityType: 'bite'})}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.activityType === 'bite' 
                      ? 'bg-orange-500/30 text-orange-300 border border-orange-400' 
                      : 'bg-black/30 text-gray-400 border border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Target size={16} className={formData.activityType === 'bite' ? 'text-orange-400' : 'text-gray-500'} />
                  <span>Got a Bite</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, activityType: 'landed'})}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.activityType === 'landed' 
                      ? 'bg-green-500/30 text-green-300 border border-green-400' 
                      : 'bg-black/30 text-gray-400 border border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Fish size={16} className={formData.activityType === 'landed' ? 'text-green-400' : 'text-gray-500'} />
                  <span>Fish Landed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, activityType: 'spotted'})}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.activityType === 'spotted' 
                      ? 'bg-blue-500/30 text-blue-300 border border-blue-400' 
                      : 'bg-black/30 text-gray-400 border border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Eye size={16} className={formData.activityType === 'spotted' ? 'text-blue-400' : 'text-gray-500'} />
                  <span>Fish Spotted</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, activityType: 'feeding'})}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.activityType === 'feeding' 
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-400' 
                      : 'bg-black/30 text-gray-400 border border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Activity size={16} className={formData.activityType === 'feeding' ? 'text-purple-400' : 'text-gray-500'} />
                  <span>Fish Feeding</span>
                </button>
              </div>
              <p className="text-[10px] text-cyan-400/70 mt-2">
                <Sparkles size={10} className="inline mr-1" />
                Even nibbles help us predict hotspots! Every data point makes our AI smarter.
              </p>
            </div>
            
            {/* Optional Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Species (optional)</label>
                <select
                  value={formData.species}
                  onChange={(e) => setFormData({...formData, species: e.target.value})}
                  className="w-full bg-black/50 border border-cyan-500/30 rounded-lg px-3 py-2 text-white focus:border-cyan-400 outline-none"
                >
                  <option value="">Select species...</option>
                  <option value="bigeye-tuna">Big Eye Tuna</option>
                  <option value="bluefin-tuna">Blue Fin Tuna</option>
                  <option value="yellowfin-tuna">Yellowfin Tuna</option>
                  <option value="longfin-tuna">Long Fin Tuna</option>
                  <option value="wahoo">Wahoo</option>
                  <option value="mahi">Mahi</option>
                  <option value="white-marlin">White Marlin</option>
                  <option value="blue-marlin">Blue Marlin</option>
                  <option value="cobia">Cobia</option>
                  <option value="rockfish">Rockfish</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                    min="1"
                    className="w-full bg-black/50 border border-cyan-500/30 rounded-lg px-3 py-2 text-white focus:border-cyan-400 outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Depth (ft)</label>
                  <input
                    type="number"
                    value={formData.depth}
                    onChange={(e) => setFormData({...formData, depth: parseInt(e.target.value)})}
                    placeholder="0"
                    className="w-full bg-black/50 border border-cyan-500/30 rounded-lg px-3 py-2 text-white focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 block mb-1">Notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Bait used, weather, sea conditions..."
                  rows={2}
                  className="w-full bg-black/50 border border-cyan-500/30 rounded-lg px-3 py-2 text-white focus:border-cyan-400 outline-none resize-none"
                />
              </div>
            </div>
          </div>
          
          {/* Footer Actions */}
          <div className="p-6 border-t border-cyan-500/20 flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <Check size={18} />
              Log Activity
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
