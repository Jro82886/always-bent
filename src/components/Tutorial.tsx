'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TutorialStep {
  title: string;
  content: string;
  highlight?: string; // CSS selector to highlight
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Welcome to Command Bridge",
    content: "This is your control center. Toggle SST and Chlorophyll layers to see ocean conditions. The date picker lets you view historical data.",
    highlight: ".header-bar"
  },
  {
    title: "Analysis Mode", 
    content: "Draw a polygon on the map to analyze conditions. ABFI will generate a fishing intelligence report based on the layers you have active.",
    highlight: ".analyze-bar"
  },
  {
    title: "Tracking Your Fleet",
    content: "In Tracking mode, see recreational boats clustered by inlet. Enable location to see yourself and your inlet fleet in real-time.",
    highlight: ".tracking-toolbar"
  },
  {
    title: "Reports & Intelligence",
    content: "All your snip analyses and ABFI bite reports are saved here. Filter by month and species to find patterns.",
    highlight: ".reports-tab"
  },
  {
    title: "Community Chat",
    content: "Connect with your inlet fleet. Share conditions, ask questions, and build local fishing intelligence together.",
    highlight: ".community-tab"
  }
];

export default function Tutorial({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Mark tutorial as seen
    localStorage.setItem('abfi_has_seen_tutorial', 'true');
    localStorage.removeItem('abfi_show_tutorial');
  }, []);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  if (!isVisible) return null;

  const step = TUTORIAL_STEPS[currentStep];

  return (
    <div className={`fixed inset-0 z-[200] pointer-events-none transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 pointer-events-auto" onClick={handleComplete} />
      
      {/* Tutorial Card */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-md pointer-events-auto">
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-cyan-500/30 p-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-cyan-300">{step.title}</h3>
            <button
              onClick={handleComplete}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Content */}
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            {step.content}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {TUTORIAL_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-cyan-400' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white/60" />
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
              >
                {currentStep === TUTORIAL_STEPS.length - 1 ? 'Get Started' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
