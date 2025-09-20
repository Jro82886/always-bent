'use client';

import { useState, useEffect } from 'react';
import { Flame, TrendingUp, Fish, AlertCircle } from 'lucide-react';

interface Highlight {
  id: string;
  type: 'bite' | 'trend' | 'species' | 'alert';
  title: string;
  message: string;
  time: string;
}

const MOCK_HIGHLIGHTS: Highlight[] = [
  {
    id: '1',
    type: 'bite',
    title: 'Hot Bite Detected',
    message: 'Stripers hitting hard on outgoing tide near the point',
    time: '15 min ago'
  },
  {
    id: '2',
    type: 'trend',
    title: 'Temperature Spike',
    message: 'SST up 3°F since yesterday, fish moving shallow',
    time: '1 hour ago'
  },
  {
    id: '3',
    type: 'species',
    title: 'Species Alert',
    message: 'First tuna of the season reported 12nm east',
    time: '2 hours ago'
  }
];

const getIcon = (type: Highlight['type']) => {
  switch(type) {
    case 'bite': return Flame;
    case 'trend': return TrendingUp;
    case 'species': return Fish;
    case 'alert': return AlertCircle;
  }
};

export default function HighlightCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % MOCK_HIGHLIGHTS.length);
      }, 7000); // Rotate every 7 seconds
      
      return () => clearInterval(interval);
    }
  }, [isPaused]);

  const current = MOCK_HIGHLIGHTS[currentIndex];
  const Icon = getIcon(current.type);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="abfi-card-bg rounded-xl p-4 border border-emerald-400/20 transition-all duration-500">
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-emerald-300 mb-1">{current.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{current.message}</p>
            <span className="text-[10px] text-slate-500 mt-2 block">{current.time}</span>
          </div>
        </div>
      </div>
      
      {/* Carousel dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {MOCK_HIGHLIGHTS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              idx === currentIndex 
                ? 'bg-emerald-400 w-4' 
                : 'bg-slate-600 hover:bg-slate-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
