"use client";
import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, MapPin, Thermometer, Leaf, Waves, Square, Sparkle } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'inlet',
    title: 'Choose Your Inlet',
    content: 'Start by selecting your inlet. This anchors ABFI to your waters and brings in real-time intelligence.',
    icon: <MapPin className="w-5 h-5" />
  },
  {
    id: 'sst',
    title: 'Reveal Sea Surface Temperature',
    content: 'Turn on SST to see the hidden highways of the ocean. Warm water shows orange/red, cool water blue/green. Fish follow these breaks.',
    icon: <Thermometer className="w-5 h-5" />
  },
  {
    id: 'chlorophyll',
    title: 'Add Chlorophyll',
    content: 'Layer in chlorophyll to reveal green plumes where plankton blooms. Where green meets blue, baitfish gather — and predators follow.',
    icon: <Leaf className="w-5 h-5" />
  },
  {
    id: 'edges',
    title: 'Spot the Edges',
    content: 'Look for sharp transitions in color. A 2–3°F change over short distance creates a hotspot where bait and predators concentrate.',
    icon: <Waves className="w-5 h-5" />
  },
  {
    id: 'snip',
    title: 'Snip & Analyze',
    content: 'Use the Snip Tool to draw over a break. ABFI will analyze SST, chlorophyll, vessel activity, and more to highlight productive water.',
    icon: <Square className="w-5 h-5" />
  },
  {
    id: 'hotspot',
    title: 'Discover Your First Hotspot',
    content: 'If conditions line up, you\'ll see a glowing hotspot marker on your map. That\'s your fishing intelligence in action.',
    icon: <Sparkle className="w-5 h-5" />
  }
];

interface NewUserTutorialProps {
  onComplete?: () => void;
}

export default function NewUserTutorial({ onComplete }: NewUserTutorialProps = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Show tutorial after a brief delay
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('abfi_tutorial_completed', 'true');
    setTimeout(() => {
      onComplete?.();
    }, 300);
  };

  const handleDontShowAgain = () => {
    localStorage.setItem('abfi_tutorial_never_show', 'true');
    handleComplete();
  };

  if (!mounted) return null;

  const step = TUTORIAL_STEPS[currentStep];

  return createPortal(
    <div className={`fixed inset-0 z-[9998] transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Tutorial Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl border border-cyan-500/30 shadow-2xl max-w-lg w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-6 py-4 border-b border-cyan-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="text-xs text-cyan-400/70">
                    Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                  </p>
                </div>
              </div>
              <button
                onClick={handleComplete}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <p className="text-gray-300 leading-relaxed">
              {step.content}
            </p>
          </div>
          
          {/* Progress */}
          <div className="px-6 pb-4">
            <div className="flex gap-1.5 mb-4">
              {TUTORIAL_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    index <= currentStep 
                      ? 'bg-cyan-500' 
                      : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Actions */}
          <div className="px-6 pb-6 flex items-center justify-between">
            <button
              onClick={handleDontShowAgain}
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              Don't show again
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  currentStep === 0
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              
              {currentStep < TUTORIAL_STEPS.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-medium flex items-center gap-2 transition-all"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-white font-medium transition-all"
                >
                  Dive In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
