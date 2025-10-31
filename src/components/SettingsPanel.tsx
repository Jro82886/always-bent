'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, Wifi, WifiOff, X, Move } from 'lucide-react';

export default function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [offlineMode, setOfflineMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('abfi_offline_mode') === 'true';
    }
    return false;
  });
  const panelRef = useRef<HTMLDivElement>(null);

  // Drag-and-drop state
  const [position, setPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('abfi_settings_position');
      return saved ? JSON.parse(saved) : { bottom: 140, right: 16 };
    }
    return { bottom: 140, right: 16 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    setIsDragging(true);
    const rect = buttonRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newBottom = window.innerHeight - (e.clientY - dragOffset.y + (buttonRef.current?.offsetHeight || 40));
      const newRight = window.innerWidth - (e.clientX - dragOffset.x + (buttonRef.current?.offsetWidth || 40));

      // Keep within viewport bounds
      const boundedBottom = Math.max(60, Math.min(window.innerHeight - 60, newBottom));
      const boundedRight = Math.max(16, Math.min(window.innerWidth - 56, newRight));

      setPosition({ bottom: boundedBottom, right: boundedRight });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Save position to localStorage
      localStorage.setItem('abfi_settings_position', JSON.stringify(position));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, position]);

  const toggleOfflineMode = () => {
    const newMode = !offlineMode;
    setOfflineMode(newMode);
    localStorage.setItem('abfi_offline_mode', newMode.toString());
    
    // Show subtle notification
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-20 right-4 z-[9999] animate-fade-in';
    notification.innerHTML = `
      <div class="bg-slate-800/95 backdrop-blur-sm border ${newMode ? 'border-orange-500/30' : 'border-green-500/30'} rounded-lg px-4 py-3 shadow-lg">
        <div class="flex items-center gap-2">
          ${newMode ? 
            '<svg class="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21"></path></svg>' :
            '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0"></path></svg>'
          }
          <span class="text-sm ${newMode ? 'text-orange-300' : 'text-green-300'}">
            ${newMode ? 'Offline Mode' : 'Online Mode'}
          </span>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add fade-in animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 2000);
  };

  return (
    <>
      {/* Settings Button - Draggable */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onMouseDown={handleMouseDown}
        className={`fixed z-50 p-3 rounded-lg transition-all duration-200 ${
          isOpen
            ? 'bg-slate-700/90 text-white shadow-lg'
            : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700/80 hover:text-white shadow-md'
        } backdrop-blur-sm border border-slate-600/30 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          bottom: `${position.bottom}px`,
          right: `${position.right}px`
        }}
        title="Settings (drag to reposition)"
      >
        {isOpen ? <X size={18} /> : <Settings size={18} />}
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed z-50 w-64 bg-slate-800/95 backdrop-blur-md rounded-lg shadow-xl border border-slate-600/30 overflow-hidden animate-slide-up"
          style={{
            bottom: `${position.bottom + 50}px`,
            right: `${position.right}px`
          }}
        >
          {/* Panel Header */}
          <div className="px-4 py-3 bg-slate-700/50 border-b border-slate-600/30">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Settings size={16} />
              Settings
            </h3>
          </div>

          {/* Settings Content */}
          <div className="p-4 space-y-4">
            {/* Offline Mode Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Connection Mode
              </label>
              <button
                onClick={toggleOfflineMode}
                className={`w-full px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between ${
                  offlineMode 
                    ? 'bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30' 
                    : 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {offlineMode ? (
                    <WifiOff size={18} className="text-orange-400" />
                  ) : (
                    <Wifi size={18} className="text-green-400" />
                  )}
                  <div className="text-left">
                    <div className={`text-sm font-medium ${offlineMode ? 'text-orange-300' : 'text-green-300'}`}>
                      {offlineMode ? 'Offline Mode' : 'Online Mode'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {offlineMode ? 'Bite button only' : 'Full features'}
                    </div>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${offlineMode ? 'bg-orange-400' : 'bg-green-400'} animate-pulse`} />
              </button>
            </div>

            {/* Info text */}
            <div className="text-[10px] text-slate-500 leading-relaxed">
              {offlineMode 
                ? 'Perfect for offshore fishing without signal. Bite reports save locally.'
                : 'Access all ABFI features including real-time analysis and community.'
              }
            </div>

            {/* Future settings can go here */}
            {/* <div className="pt-3 border-t border-slate-700/50">
              <p className="text-[10px] text-slate-600 italic">More settings coming soon...</p>
            </div> */}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
