'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'Mine' },
  { id: 'saved', label: 'Saved' },
  { id: 'hot', label: 'Hot' }
];

const SPECIES_OPTIONS = [
  { value: 'all', label: 'All Species' },
  { value: 'striped-bass', label: 'Striped Bass' },
  { value: 'bluefish', label: 'Bluefish' },
  { value: 'fluke', label: 'Fluke' },
  { value: 'blackfish', label: 'Blackfish' },
  { value: 'weakfish', label: 'Weakfish' },
  { value: 'other', label: 'Other' }
];

const DATE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' }
];

export default function ReportsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const activeTab = searchParams.get('tab') || 'all';
  const species = searchParams.get('species') || 'all';
  const dateRange = searchParams.get('date') || 'week';
  
  const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/legendary/community?${params.toString()}`);
  };

  return (
    <div className="bg-black/40 backdrop-blur-md border-b border-cyan-500/20 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Tab filters */}
        <div className="flex items-center gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => updateFilter('tab', tab.id)}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-all
                ${activeTab === tab.id 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Inline filters */}
        <div className="flex items-center gap-3">
          {/* Species filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSpeciesDropdown(!showSpeciesDropdown);
                setShowDateDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800/50 border border-gray-700 rounded-lg hover:border-cyan-500/40 transition-colors"
            >
              <span className="text-gray-300">
                {SPECIES_OPTIONS.find(opt => opt.value === species)?.label}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            
            {showSpeciesDropdown && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                {SPECIES_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      updateFilter('species', option.value);
                      setShowSpeciesDropdown(false);
                    }}
                    className={`
                      w-full px-3 py-2 text-sm text-left hover:bg-gray-700 transition-colors
                      ${species === option.value ? 'text-cyan-400' : 'text-gray-300'}
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDateDropdown(!showDateDropdown);
                setShowSpeciesDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800/50 border border-gray-700 rounded-lg hover:border-cyan-500/40 transition-colors"
            >
              <span className="text-gray-300">
                {DATE_OPTIONS.find(opt => opt.value === dateRange)?.label}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            
            {showDateDropdown && (
              <div className="absolute top-full right-0 mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                {DATE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      updateFilter('date', option.value);
                      setShowDateDropdown(false);
                    }}
                    className={`
                      w-full px-3 py-2 text-sm text-left hover:bg-gray-700 transition-colors
                      ${dateRange === option.value ? 'text-cyan-400' : 'text-gray-300'}
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
