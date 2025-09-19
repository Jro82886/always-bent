'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, ChevronDown, X } from 'lucide-react';
import { useAppState } from '@/store/appState';
import { INLETS as inlets } from '@/lib/inlets';

interface InletChipProps {
  compact?: boolean;
}

export default function InletChip({ compact = false }: InletChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { selectedInletId, setSelectedInletId } = useAppState();
  
  const selectedInlet = inlets.find(i => i.id === selectedInletId);
  
  // Filtered inlets based on search
  const filteredInlets = inlets.filter(inlet =>
    inlet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inlet.state.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredInlets.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredInlets.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && filteredInlets[selectedIndex]) {
            handleInletSelect(filteredInlets[selectedIndex].id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredInlets]);
  
  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);
  
  // Reset search and selection when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedIndex(-1);
    }
  }, [isOpen]);
  
  const handleInletSelect = (inletId: string) => {
    setSelectedInletId(inletId);
    setIsOpen(false);
    
    // Update URL with debounced sync
    setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      params.set('inlet', inletId);
      window.history.replaceState(null, '', `?${params.toString()}`);
    }, 150);
  };
  
  // Calculate dropdown position
  const getDropdownPosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0 };
    
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownHeight = 400; // Max height
    const dropdownWidth = 320;
    
    // Position below trigger by default
    let top = rect.bottom + 8;
    let left = rect.left;
    
    // Adjust if would go off bottom
    if (top + dropdownHeight > viewportHeight - 20) {
      top = rect.top - dropdownHeight - 8;
    }
    
    // Adjust if would go off right
    if (left + dropdownWidth > viewportWidth - 20) {
      left = rect.right - dropdownWidth;
    }
    
    // Ensure not off left
    if (left < 20) {
      left = 20;
    }
    
    return { top, left };
  };
  
  const dropdownPosition = getDropdownPosition();

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-all"
      >
        <MapPin className="w-3 h-3 text-cyan-400" />
        {compact ? (
          <span className="text-xs text-cyan-300 font-medium">
            {selectedInlet?.name.split(' ')[0] || 'Inlet'}
          </span>
        ) : (
          <span className="text-xs text-cyan-300 font-medium">
            Inlet: {selectedInlet?.name || 'Select'}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 text-cyan-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Dropdown Portal */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed w-80 bg-gray-950/98 backdrop-blur-xl border border-cyan-500/40 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] overflow-hidden"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 9999
          }}
        >
          {/* Header with Search */}
          <div className="px-3 py-2.5 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-b border-cyan-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
                SELECT FISHING AREA
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-cyan-500/20 rounded transition-colors"
              >
                <X className="w-3 h-3 text-cyan-400" />
              </button>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search inlets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-black/40 border border-cyan-500/20 rounded-lg text-sm text-cyan-100 placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400/40"
            />
          </div>
          
          {/* Inlet List */}
          <div className="max-h-80 overflow-y-auto bg-black/40">
            {['ME', 'MA', 'RI', 'NY', 'NJ', 'DE', 'MD', 'VA', 'NC', 'SC', 'GA', 'GA/FL', 'FL', 'FL Keys'].map(state => {
              const stateInlets = filteredInlets.filter(i => i.state === state);
              if (stateInlets.length === 0) return null;
              
              return (
                <div key={state}>
                  <div className="px-3 py-1 bg-gray-900/60 border-t border-cyan-500/10">
                    <div className="text-[10px] text-cyan-500/70 font-semibold">{state}</div>
                  </div>
                  {stateInlets.map((inlet, idx) => {
                    const isSelected = selectedInletId === inlet.id;
                    const isHighlighted = selectedIndex === filteredInlets.indexOf(inlet);
                    const inletColor = inlet.color || '#64748b';
                    
                    return (
                      <button
                        key={inlet.id}
                        onClick={() => handleInletSelect(inlet.id)}
                        onMouseEnter={() => setSelectedIndex(filteredInlets.indexOf(inlet))}
                        className={`
                          w-full px-3 py-2.5 text-left transition-all flex items-center gap-3 group
                          ${isSelected 
                            ? 'bg-gradient-to-r from-cyan-500/20 to-transparent' 
                            : isHighlighted
                            ? 'bg-gradient-to-r from-cyan-500/15 to-transparent'
                            : 'hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-transparent'
                          }
                        `}
                      >
                        {/* Glowing Color Chip */}
                        <div 
                          className={`w-3 h-3 rounded-sm transition-all ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}
                          style={{
                            backgroundColor: inletColor,
                            boxShadow: isSelected || isHighlighted 
                              ? `0 0 12px ${inletColor}` 
                              : `0 0 6px ${inletColor}66`
                          }}
                        />
                        
                        <div className="flex-1">
                          <div className={`text-sm ${isSelected ? 'text-cyan-200' : 'text-gray-300 group-hover:text-cyan-200'}`}>
                            {inlet.name}
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
