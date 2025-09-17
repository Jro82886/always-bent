'use client';

import { useEffect, useRef } from 'react';

/**
 * Sound effects and haptic feedback system
 */

// Sound URLs (you'll need to add these sound files to public/sounds/)
const SOUNDS = {
  success: '/sounds/success.mp3',
  catch: '/sounds/catch.mp3',
  ping: '/sounds/ping.mp3',
  wave: '/sounds/wave.mp3',
  bubble: '/sounds/bubble.mp3',
  notification: '/sounds/notification.mp3',
  error: '/sounds/error.mp3'
};

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    // Check if sounds are enabled in localStorage
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('abfi_sounds') !== 'false';
      this.volume = parseFloat(localStorage.getItem('abfi_volume') || '0.5');
    }
  }

  preload(soundName: keyof typeof SOUNDS) {
    if (typeof window === 'undefined') return;
    
    const url = SOUNDS[soundName];
    if (!url || this.sounds.has(soundName)) return;
    
    const audio = new Audio(url);
    audio.volume = this.volume;
    audio.preload = 'auto';
    this.sounds.set(soundName, audio);
  }

  play(soundName: keyof typeof SOUNDS) {
    if (!this.enabled || typeof window === 'undefined') return;
    
    // Preload if not already loaded
    if (!this.sounds.has(soundName)) {
      this.preload(soundName);
    }
    
    const audio = this.sounds.get(soundName);
    if (audio) {
      // Clone and play to allow overlapping sounds
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = this.volume;
      clone.play().catch(e => {
        // Ignore autoplay errors
        console.log('Sound play failed:', e);
      });
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('abfi_sounds', enabled.toString());
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (typeof window !== 'undefined') {
      localStorage.setItem('abfi_volume', this.volume.toString());
    }
    
    // Update all loaded sounds
    this.sounds.forEach(audio => {
      audio.volume = this.volume;
    });
  }

  vibrate(pattern: number | number[] = 50) {
    if (!this.enabled || typeof window === 'undefined' || !window.navigator.vibrate) return;
    
    try {
      window.navigator.vibrate(pattern);
    } catch (e) {
      // Vibration not supported
    }
  }
}

// Global sound manager instance
export const soundManager = new SoundManager();

// React hook for sound effects
export function useSoundEffect() {
  useEffect(() => {
    // Preload common sounds
    soundManager.preload('ping');
    soundManager.preload('success');
    soundManager.preload('notification');
  }, []);

  return {
    playSound: (sound: keyof typeof SOUNDS) => soundManager.play(sound),
    vibrate: (pattern?: number | number[]) => soundManager.vibrate(pattern),
    setEnabled: (enabled: boolean) => soundManager.setEnabled(enabled),
    setVolume: (volume: number) => soundManager.setVolume(volume)
  };
}

// Sound control UI component
export function SoundControls() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('abfi_sounds') !== 'false';
    }
    return true;
  });
  
  const [volume, setVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseFloat(localStorage.getItem('abfi_volume') || '0.5');
    }
    return 0.5;
  });

  const handleToggle = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    soundManager.setEnabled(newEnabled);
    
    if (newEnabled) {
      soundManager.play('ping');
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    soundManager.setVolume(newVolume);
    soundManager.play('ping');
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-4 border border-cyan-500/20">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-cyan-100">
          Sound Effects
        </label>
        <button
          onClick={handleToggle}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            enabled ? 'bg-cyan-500' : 'bg-gray-600'
          }`}
        >
          <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-0'
          }`} />
        </button>
      </div>
      
      {enabled && (
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Volume</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-cyan-500
                     [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>🔇</span>
            <span>{Math.round(volume * 100)}%</span>
            <span>🔊</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Notification toast with sound
export function NotificationToast({ 
  message, 
  type = 'info',
  duration = 3000,
  onClose
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}) {
  const { playSound, vibrate } = useSoundEffect();

  useEffect(() => {
    // Play appropriate sound
    if (type === 'success') {
      playSound('success');
      vibrate([50, 100, 50]);
    } else if (type === 'error') {
      playSound('error');
      vibrate([100, 50, 100]);
    } else {
      playSound('notification');
      vibrate(50);
    }

    // Auto close
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [type, duration, onClose, playSound, vibrate]);

  const bgColor = {
    success: 'bg-green-500/20 border-green-500/50',
    error: 'bg-red-500/20 border-red-500/50',
    warning: 'bg-yellow-500/20 border-yellow-500/50',
    info: 'bg-cyan-500/20 border-cyan-500/50'
  }[type];

  const icon = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }[type];

  return (
    <div className={`fixed top-4 right-4 z-[99999] animate-slide-in-right`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColor}
                    backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.3)]`}>
        <span className="text-2xl">{icon}</span>
        <p className="text-sm text-white">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
