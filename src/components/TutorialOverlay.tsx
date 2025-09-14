"use client";
import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle, Fish, Thermometer, Target, Scissors, BarChart3, Lightbulb, HandMetal } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  tip?: string;
  position?: { top?: string; left?: string; right?: string; bottom?: string };
  highlight?: string; // CSS selector for element to highlight
  action?: string; // What user should do
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Ocean Intelligence',
    content: 'Let me show you how to find the best fishing spots using real-time ocean data.',
    tip: 'This 2-minute tutorial will make you a pro at reading the water.'
  },
  {
    id: 'sst-layer',
    title: 'Step 1: Turn on Sea Surface Temperature',
    content: 'Click the SST toggle to see water temperatures. Warmer water appears orange/red, cooler water appears blue/green.',
    tip: 'Fish love temperature breaks where different water masses meet!',
    action: 'Toggle SST to see temperature data'
  },
  {
    id: 'find-edges',
    title: 'Step 2: Look for Temperature Edges',
    content: 'Zoom in and look for areas where colors change dramatically - these are temperature breaks where bait and predators gather.',
    tip: 'A 2-3°F change over a short distance is a hotspot!',
    action: 'Use scroll or zoom controls to explore'
  },
  {
    id: 'snip-tool',
    title: 'Step 3: Analyze an Area',
    content: 'Click "Select Area to Analyze" then click two corners to draw a rectangle around a temperature edge.',
    tip: 'Include both warm and cool water in your selection for best results.',
    action: 'Draw a rectangle over a temperature break'
  },
  {
    id: 'read-analysis',
    title: 'Step 4: Understanding Your Analysis',
    content: 'If a hotspot is found, you\'ll see a cyan marker. Click it to read why that spot is productive.',
    tip: 'No hotspot? The analysis will teach you what to look for next time!'
  },
  {
    id: 'pro-tips',
    title: 'Pro Tips',
    content: 'Best fishing happens at: Gulf Stream edges, canyon breaks, where blue water meets green, and around temperature fronts.',
    tip: 'Save good analyses to build your own fishing intelligence database!'
  }
];

export default function TutorialOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user has seen tutorial
    const seen = localStorage.getItem('abfi_tutorial_seen');
    const skipTutorial = localStorage.getItem('abfi_skip_tutorial');
    
    if (!seen && skipTutorial !== 'true') {
      // Show tutorial with smooth entrance after welcome screen
      setTimeout(() => {
        setIsVisible(true);
        // Smooth fade-in animation with requestAnimationFrame for better performance
        requestAnimationFrame(() => {
          setTimeout(() => setIsAnimating(true), 50);
        });
      }, 2500); // Slightly longer delay for smoother transition from welcome
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(true);
      }, 150);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(true);
      }, 150);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('abfi_tutorial_seen', 'true');
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleDontShowAgain = () => {
    localStorage.setItem('abfi_skip_tutorial', 'true');
    handleComplete();
  };

  if (!isVisible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <>
      {/* Enhanced blur overlay with smooth transition */}
      <div 
        className={`fixed inset-0 z-50 transition-all duration-700 ${
          isAnimating 
            ? 'bg-black/70 backdrop-blur-md' 
            : 'bg-black/0 backdrop-blur-none'
        }`}
        onClick={handleSkip}
      />
      
      {/* Tutorial Card with subtle entrance animation */}
      <div
        className={`fixed z-50 transition-all duration-500 ${
          isAnimating 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
        style={{
          top: step.position?.top || '50%',
          left: step.position?.left || '50%',
          transform: 'translate(-50%, -50%)',
          animation: isAnimating && currentStep === 0 ? 'subtle-pulse 2s ease-in-out infinite' : 'none'
        }}
      >
        <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-2xl shadow-2xl border border-cyan-500/30 max-w-md w-full">
          {/* Progress bar */}
          <div className="h-1 bg-gray-800 rounded-t-2xl overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Header */}
          <div className="p-6 border-b border-cyan-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {currentStep === 0 && <Fish size={20} className="text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]" />}
                {currentStep === 1 && <Thermometer size={20} className="text-orange-300 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />}
                {currentStep === 2 && <Target size={20} className="text-green-300 drop-shadow-[0_0_8px_rgba(134,239,172,0.8)]" />}
                {currentStep === 3 && <Scissors size={20} className="text-purple-300 drop-shadow-[0_0_8px_rgba(216,180,254,0.8)]" />}
                {currentStep === 4 && <BarChart3 size={20} className="text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.8)]" />}
                {currentStep === 5 && <Lightbulb size={20} className="text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />}
                {step.title}
              </h3>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-xs text-cyan-400 mt-1">
              Step {currentStep + 1} of {TUTORIAL_STEPS.length}
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-gray-300 leading-relaxed">
              {step.content}
            </p>
            
            {step.tip && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                <p className="text-cyan-300 text-sm flex items-start gap-2">
                  <Lightbulb size={16} className="text-yellow-300 drop-shadow-[0_0_6px_rgba(253,224,71,0.8)] mt-0.5 flex-shrink-0" />
                  <span><span className="font-semibold">Tip:</span> {step.tip}</span>
                </p>
              </div>
            )}
            
            {step.action && (
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-3 border border-blue-500/30">
                <p className="text-blue-300 text-sm font-medium flex items-center gap-2">
                  <HandMetal size={16} className="text-cyan-300 drop-shadow-[0_0_6px_rgba(103,232,249,0.8)]" />
                  {step.action}
                </p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-cyan-500/20">
            <div className="flex items-center justify-between">
              <button
                onClick={handleDontShowAgain}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Don't show again
              </button>
              
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>
                )}
                
                {currentStep < TUTORIAL_STEPS.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold transition-all flex items-center gap-1"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white rounded-lg font-semibold transition-all flex items-center gap-1"
                  >
                    Start Fishing!
                    <CheckCircle size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Pointing arrow for specific elements */}
        {step.highlight && currentStep > 0 && currentStep < 5 && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <div className="text-cyan-400 animate-bounce">
              ↑
            </div>
          </div>
        )}
      </div>
    </>
  );
}
