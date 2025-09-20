'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { communitySteps, soloSteps, type TourStep } from '@/config/TourSteps';
import { useAppState } from '@/store/appState';
import { useRouter } from 'next/navigation';

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'community' | 'analysis';
}

export default function TutorialOverlay({ isOpen, onClose, mode }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [skipLocationStep, setSkipLocationStep] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { selectedInletId } = useAppState();
  
  const steps = mode === 'community' ? communitySteps : soloSteps;
  const currentStepData = steps[currentStep];
  
  useEffect(() => {
    // Check location permission status
    const checkLocation = async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setLocationEnabled(permission.state === 'granted');
      } catch {
        setLocationEnabled(false);
      }
    };
    
    if (isOpen) {
      checkLocation();
    }
  }, [isOpen]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        handleBack();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
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
    // Navigate to appropriate tab based on mode
    const targetMode = mode === 'community' ? 'tracking' : 'analysis';
    const inlet = localStorage.getItem('abfi_selected_inlet');
    const params = new URLSearchParams();
    params.set('mode', targetMode);
    if (inlet) {
      params.set('inlet', inlet);
    }
    router.push(`/legendary?${params.toString()}`);
    onClose();
  };
  
  const handleEnableLocation = async () => {
    try {
      await navigator.geolocation.getCurrentPosition(
        () => {
          setLocationEnabled(true);
          localStorage.setItem('abfi_location_enabled', 'true');
          handleNext();
        },
        () => {
          // User denied - continue with tour
          setSkipLocationStep(true);
          handleNext();
        }
      );
    } catch {
      setSkipLocationStep(true);
      handleNext();
    }
  };
  
  // Spotlight positioning logic
  const getSpotlightStyles = () => {
    if (!currentStepData.target || !isOpen) return {};
    
    try {
      const element = document.querySelector(currentStepData.target);
      if (!element) return {};
      
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
      };
    } catch {
      return {};
    }
  };
  
  if (!isOpen) return null;
  
  // Special handling for location permission step
  const isLocationStep = currentStepData.id === 'show-me' && mode === 'community' && !locationEnabled && !skipLocationStep;
  
  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[9999] pointer-events-auto"
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Spotlight (if element exists) */}
      {currentStepData.target && currentStepData.spotlightType === 'element' && (
        <div 
          className="absolute rounded-lg ring-2 ring-cyan-400/50 shadow-[0_0_40px_rgba(0,221,235,0.3)]"
          style={getSpotlightStyles()}
        />
      )}
      
      {/* Tutorial Card */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[min(92vw,480px)]">
        <div className="bg-slate-900/95 backdrop-blur-md rounded-xl p-6 shadow-2xl ring-1 ring-cyan-500/20">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white/90 transition-colors"
            aria-label="Skip tutorial"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Content */}
          <div className="space-y-4">
            {currentStepData.title && (
              <h3 className="text-lg font-semibold text-white">
                {currentStepData.title}
              </h3>
            )}
            
            <p className="text-sm text-white/80 leading-relaxed">
              {isLocationStep && !skipLocationStep
                ? 'Enable location to join your fleet now.'
                : skipLocationStep && currentStepData.id === 'show-me'
                ? 'This feature unlocks when you enable location.'
                : currentStepData.content}
            </p>
            
            {/* Location permission buttons */}
            {isLocationStep && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleEnableLocation}
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500/20 ring-1 ring-cyan-400/40 text-cyan-300 text-sm font-medium hover:bg-cyan-500/30 transition-colors"
                >
                  Enable
                </button>
                <button
                  onClick={() => {
                    setSkipLocationStep(true);
                    handleNext();
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white/70 text-sm font-medium hover:bg-white/15 transition-colors"
                >
                  Later
                </button>
              </div>
            )}
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {/* Back button */}
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentStep === 0
                  ? 'opacity-40 cursor-not-allowed text-white/50'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              <ChevronLeft className="w-3 h-3" />
              Back
            </button>
            
            {/* Progress dots */}
            <div className="flex gap-1.5">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-cyan-400 w-4 shadow-[0_0_8px_rgba(0,221,235,0.5)]'
                      : index < currentStep
                      ? 'bg-cyan-400/50'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
            
            {/* Next/Done button */}
            {!isLocationStep && (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-cyan-500/20 ring-1 ring-cyan-400/40 text-cyan-300 text-xs font-medium hover:bg-cyan-500/30 transition-colors"
              >
                {currentStep === steps.length - 1 ? 'Done — Enter ABFI' : 'Next'}
                {currentStep < steps.length - 1 && <ChevronRight className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
