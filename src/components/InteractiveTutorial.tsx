'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Info, Ship, Target, Waves, Eye } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  position?: { top?: string; left?: string; right?: string; bottom?: string };
  highlight?: string; // CSS selector for element to highlight
  action?: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Always Bent Intelligence',
    content: 'Let me show you how to find the best fishing spots using real-time ocean data and vessel tracking.',
    icon: <Waves className="w-6 h-6 text-cyan-400" />,
  },
  {
    id: 'snip-tool',
    title: 'Snip Tool - Your Analysis Window',
    content: 'Click and drag to draw a rectangle on the map. This analyzes SST, chlorophyll, and vessel activity in that area.',
    icon: <Target className="w-6 h-6 text-green-400" />,
    highlight: '.snip-tool-button',
  },
  {
    id: 'vessel-colors',
    title: 'Understanding Vessel Tracks',
    content: 'vesselLegend', // Special marker for custom content
    icon: <Ship className="w-6 h-6 text-orange-400" />,
  },
  {
    id: 'hotspots',
    title: 'Hotspot Detection',
    content: 'Pulsing yellow markers show high-confidence fishing spots based on temperature breaks, vessel activity, and ocean conditions.',
    icon: <Target className="w-6 h-6 text-yellow-400" />,
  },
  {
    id: 'layers',
    title: 'Ocean Data Layers',
    content: 'Toggle SST (Sea Surface Temperature) and CHL (Chlorophyll) to see where bait fish gather at temperature breaks.',
    icon: <Eye className="w-6 h-6 text-blue-400" />,
    highlight: '.layer-controls',
  },
  {
    id: 'analysis',
    title: 'Click for Details',
    content: 'Click on any hotspot or vessel track to get detailed analysis including confidence scores and fishing recommendations.',
    icon: <Info className="w-6 h-6 text-purple-400" />,
  },
];

interface InteractiveTutorialProps {
  onComplete?: () => void;
  autoStart?: boolean;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
}

export default function InteractiveTutorial({ onComplete, autoStart = false, triggerRef }: InteractiveTutorialProps) {
  const [isActive, setIsActive] = useState(autoStart);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  useEffect(() => {
    // Check if user has seen tutorial
    const seen = localStorage.getItem('abfi_tutorial_seen');
    if (seen) {
      setHasSeenTutorial(true);
    } else if (!autoStart) {
      // Don't auto-start anymore - only via button
      // setTimeout(() => setIsActive(true), 2000);
    }
  }, [autoStart]);

  // Expose the start function via ref
  useEffect(() => {
    if (triggerRef) {
      triggerRef.current = () => {
        setIsActive(true);
        setCurrentStep(0);
      };
    }
  }, [triggerRef]);

  useEffect(() => {
    if (isActive && tutorialSteps[currentStep]?.highlight) {
      // Add highlight class to element
      const element = document.querySelector(tutorialSteps[currentStep].highlight!);
      if (element) {
        element.classList.add('tutorial-highlight');
        return () => {
          element.classList.remove('tutorial-highlight');
        };
      }
    }
  }, [currentStep, isActive]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    localStorage.setItem('abfi_tutorial_seen', 'true');
    setHasSeenTutorial(true);
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isActive) {
    // Floating help button
    return (
      <button
        onClick={() => {
          setIsActive(true);
          setCurrentStep(0);
        }}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 group"
        title="Show Tutorial"
      >
        <Info className="w-5 h-5" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Show Tutorial
        </span>
      </button>
    );
  }

  const step = tutorialSteps[currentStep];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleSkip} />

      {/* Tutorial Card */}
      <div
        className="fixed z-50 bg-gray-900 text-white rounded-xl shadow-2xl p-6 max-w-md transform transition-all duration-500"
        style={{
          top: step.position?.top || '50%',
          left: step.position?.left || '50%',
          right: step.position?.right,
          bottom: step.position?.bottom,
          transform: (!step.position || (step.position.left === '50%' && step.position.top === '50%')) 
            ? 'translate(-50%, -50%)' 
            : undefined,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {step.icon}
            <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {step.title}
            </h3>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          {step.content === 'vesselLegend' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-0.5 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                <span className="text-cyan-300 text-sm">Cyan</span>
                <span className="text-gray-400 text-sm">= Recreational boats</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-0.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
                <span className="text-orange-300 text-sm">Orange</span>
                <span className="text-gray-400 text-sm">= Commercial vessels (GFW)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                <span className="text-blue-300 text-sm">Blue</span>
                <span className="text-gray-400 text-sm">= Your fleet</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                  <div className="absolute inset-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-30" />
                </div>
                <span className="text-yellow-300 text-sm ml-1">Yellow</span>
                <span className="text-gray-400 text-sm">= Hotspots</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-300 whitespace-pre-line leading-relaxed">
              {step.content}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-4">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                index <= currentStep ? 'bg-cyan-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              currentStep === 0
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-sm text-gray-500">
            {currentStep + 1} of {tutorialSteps.length}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Highlight Styles */}
      <style jsx global>{`
        .tutorial-highlight {
          position: relative;
          z-index: 45;
          animation: pulse-highlight 2s infinite;
        }

        @keyframes pulse-highlight {
          0% {
            box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(6, 182, 212, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(6, 182, 212, 0);
          }
        }
      `}</style>
    </>
  );
}
