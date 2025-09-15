/**
 * Feature Spotlight
 * Introduces new features to users with visual callouts
 * Helps with feature discovery and user education
 */

"use client";
import { useState, useEffect } from 'react';
import { X, Zap, WifiOff, TrendingUp, Users, ChevronRight } from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetElement?: string; // CSS selector to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const ABFI_FEATURES: Feature[] = [
  {
    id: 'abfi-button',
    title: 'NEW: ABFI Instant Bite Logging',
    description: 'One tap logs your bite with GPS & ocean data. Works offline too!',
    icon: <Zap className="text-yellow-300" size={20} />,
    targetElement: '#abfi-bite-btn',
    position: 'top'
  },
  {
    id: 'offline-mode',
    title: 'Works Offline!',
    description: 'No signal? No problem. Bites save locally and sync when online.',
    icon: <WifiOff className="text-orange-400" size={20} />,
  },
  {
    id: 'abfi-highlights',
    title: 'ABFI Highlights',
    description: 'Get 4+ bites in an hour? You\'ll be featured as an ABFI Highlight!',
    icon: <TrendingUp className="text-cyan-400" size={20} />,
  },
  {
    id: 'community-reports',
    title: 'Live Intelligence Feed',
    description: 'See real-time bite reports from the fleet in Community > Reports',
    icon: <Users className="text-green-400" size={20} />,
  }
];

export default function FeatureSpotlight() {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has seen the ABFI features
    const hasSeenABFI = localStorage.getItem('abfi_features_seen_v2');
    if (!hasSeenABFI) {
      // Show after a short delay
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, []);

  const handleNext = () => {
    if (currentFeature < ABFI_FEATURES.length - 1) {
      setCurrentFeature(currentFeature + 1);
      
      // Highlight the target element if specified
      const feature = ABFI_FEATURES[currentFeature + 1];
      if (feature.targetElement) {
        highlightElement(feature.targetElement);
      }
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('abfi_features_seen_v2', 'true');
    setTimeout(() => setIsVisible(false), 300);
    
    // Remove any highlights
    document.querySelectorAll('.abfi-highlight-ring').forEach(el => el.remove());
  };

  const highlightElement = (selector: string) => {
    const element = document.querySelector(selector);
    if (element) {
      // Remove old highlights
      document.querySelectorAll('.abfi-highlight-ring').forEach(el => el.remove());
      
      // Create highlight ring
      const rect = element.getBoundingClientRect();
      const highlight = document.createElement('div');
      highlight.className = 'abfi-highlight-ring';
      highlight.style.cssText = `
        position: fixed;
        top: ${rect.top - 10}px;
        left: ${rect.left - 10}px;
        width: ${rect.width + 20}px;
        height: ${rect.height + 20}px;
        border: 3px solid rgba(6, 182, 212, 0.8);
        border-radius: 16px;
        pointer-events: none;
        z-index: 9998;
        animation: pulse-ring 2s infinite;
        box-shadow: 0 0 40px rgba(6, 182, 212, 0.6);
      `;
      document.body.appendChild(highlight);
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    // Highlight first feature if it has a target
    if (isVisible && !isDismissed) {
      const feature = ABFI_FEATURES[currentFeature];
      if (feature.targetElement) {
        highlightElement(feature.targetElement);
      }
    }
  }, [isVisible, currentFeature, isDismissed]);

  if (!isVisible || isDismissed) return null;

  const feature = ABFI_FEATURES[currentFeature];

  return (
    <>
      {/* Add pulse animation */}
      <style jsx global>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      {/* Dark overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9997]"
        onClick={handleDismiss}
      />

      {/* Feature Card */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] animate-fade-in">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-cyan-500/30 p-6 max-w-md">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                {feature.icon}
              </div>
              <div>
                <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">
                  New Feature
                </div>
                <h3 className="text-lg font-bold text-white">
                  {feature.title}
                </h3>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            {feature.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {ABFI_FEATURES.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 transition-all ${
                    index === currentFeature
                      ? 'w-8 bg-cyan-400'
                      : index < currentFeature
                      ? 'w-2 bg-cyan-600'
                      : 'w-2 bg-slate-600'
                  } rounded-full`}
                />
              ))}
            </div>

            {/* Next/Done button */}
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg font-medium transition-all flex items-center gap-2 border border-cyan-500/30"
            >
              {currentFeature < ABFI_FEATURES.length - 1 ? (
                <>
                  Next
                  <ChevronRight size={16} />
                </>
              ) : (
                'Got it!'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
