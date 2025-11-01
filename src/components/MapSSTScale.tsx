'use client';

import React, { useState, useRef, useEffect } from 'react';
import EastCoastSSTScale from './EastCoastSSTScale';
import { Thermometer, ChevronRight, ChevronLeft } from 'lucide-react';

interface MapSSTScaleProps {
  currentTemp?: number;
}

export default function MapSSTScale({ currentTemp }: MapSSTScaleProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHidden, setIsHidden] = useState(true); // Start hidden by default

  // Drag-and-drop state
  const [position, setPosition] = useState({ bottom: 96, right: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load position from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem('abfi_sst_scale_position');
    if (saved) {
      setPosition(JSON.parse(saved));
    }
  }, []);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = containerRef.current || buttonRef.current;
    if (!target) return;
    setIsDragging(true);
    const rect = target.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const target = containerRef.current || buttonRef.current;
      const newBottom = window.innerHeight - (e.clientY - dragOffset.y + (target?.offsetHeight || 60));
      const newRight = window.innerWidth - (e.clientX - dragOffset.x + (target?.offsetWidth || 320));

      // Keep within viewport bounds
      const boundedBottom = Math.max(16, Math.min(window.innerHeight - 100, newBottom));
      const boundedRight = Math.max(16, Math.min(window.innerWidth - 320, newRight));

      setPosition({ bottom: boundedBottom, right: boundedRight });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Save position to localStorage
      localStorage.setItem('abfi_sst_scale_position', JSON.stringify(position));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, position]);

  // Don't render if completely hidden
  if (isHidden) {
    return (
      <button
        ref={buttonRef}
        onClick={() => setIsHidden(false)}
        onMouseDown={handleMouseDown}
        className={`fixed z-50 p-2 bg-slate-900/95 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          bottom: `${position.bottom}px`,
          right: `${position.right}px`
        }}
        title="Show SST Scale (drag to reposition)"
      >
        <Thermometer className="w-5 h-5 text-cyan-400" />
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`fixed z-50 transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-80'
      } ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{
        bottom: `${position.bottom}px`,
        right: `${position.right}px`
      }}
    >
      <div className="bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl backdrop-blur-sm">
        {/* Header - Draggable */}
        <div
          onMouseDown={handleMouseDown}
          className={`flex items-center justify-between p-3 border-b border-slate-700 ${
            !isDragging ? 'cursor-grab' : 'cursor-grabbing'
          }`}
        >
          {!isCollapsed && (
            <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              East Coast SST Scale
            </h3>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-slate-800 rounded transition-colors ml-auto"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

        {/* Scale Content */}
        {!isCollapsed && (
          <div className="p-4">
            <EastCoastSSTScale
              currentTemp={currentTemp}
              unit="F"
              orientation="horizontal"
              className="w-full"
            />

            {/* Quick Reference */}
            <div className="mt-3 pt-3 border-t border-slate-700 space-y-1">
              <div className="text-xs text-slate-400">Optimal Ranges:</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="text-slate-300">
                  <span className="text-cyan-400">•</span> Tuna: 68-78°F
                </div>
                <div className="text-slate-300">
                  <span className="text-green-400">•</span> Mahi: 75-82°F
                </div>
                <div className="text-slate-300">
                  <span className="text-blue-400">•</span> Stripers: 50-65°F
                </div>
                <div className="text-slate-300">
                  <span className="text-yellow-400">•</span> Bluefish: 60-72°F
                </div>
              </div>
            </div>

            {/* Hide button */}
            <button
              onClick={() => setIsHidden(true)}
              className="mt-3 w-full text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              Hide Scale
            </button>
          </div>
        )}
      </div>
    </div>
  );
}