'use client';

import { useEffect, useState } from 'react';
import { useMapbox } from '@/lib/MapCtx';
import { modeManager } from '@/lib/modeManager';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';
import { flyToInlet60nm } from '@/lib/inletBounds';

// Import all the Analysis components
import SSTLayer from '@/components/layers/SSTLayer';
import CoastlineSmoother from '@/components/layers/CoastlineSmoother';
import InletRegions from '@/components/InletRegions';
import TutorialOverlay from '@/components/TutorialOverlay';
import UnifiedCommandBar from '@/components/UnifiedCommandBar';
import LeftZone from '@/components/LeftZone';
import RightZone from '@/components/RightZone';
import ReportCatchButton from '@/components/ReportCatchButton';
import InteractiveTutorial from '@/components/InteractiveTutorial';
import UnifiedRightPanel from '@/components/UnifiedRightPanel';
import '@/styles/mapSmoothing.css';

export default function LegendaryV2Page() {
  const map = useMapbox(); // Get map from MapShell context
  const { selectedInletId } = useAppState();
  
  // Track if analysis modal is open
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  
  // Tutorial states
  const [showingTutorial, setShowingTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  
  // Ocean layer states
  const [oceanActive, setOceanActive] = useState(false);
  const [sstActive, setSstActive] = useState(false);
  const [chlActive, setChlActive] = useState(false);
  const [selectedDate, setSelectedDate] = useState('today');
  const [oceanOpacity, setOceanOpacity] = useState(60);
  const [sstOpacity, setSstOpacity] = useState(90);
  const [chlOpacity, setChlOpacity] = useState(70);
  const [edgeMode, setEdgeMode] = useState(false);
  
  // Get boat name
  const [boatName, setBoatName] = useState<string>('');
  
  // Initialize mode manager
  useEffect(() => {
    if (!map) return;
    
    console.log('[LegendaryV2] Initializing with shared map');
    modeManager.setMap(map);
    modeManager.switchMode('analysis');
    
    return () => {
      // Cleanup handled by modeManager
    };
  }, [map]);
  
  // Check tutorial status
  useEffect(() => {
    const seen = localStorage.getItem('abfi_tutorial_seen');
    const skip = localStorage.getItem('abfi_skip_tutorial');
    setShowingTutorial(!seen && skip !== 'true');
    setTutorialCompleted(seen === 'true');
  }, []);
  
  // Get boat name
  useEffect(() => {
    const storedBoatName = localStorage.getItem('abfi_boat_name');
    if (storedBoatName) {
      setBoatName(storedBoatName);
    }
  }, []);
  
  // Handle inlet changes
  useEffect(() => {
    if (!map || !selectedInletId) return;
    
    const inlet = getInletById(selectedInletId);
    if (inlet) {
      flyToInlet60nm(map, inlet);
      console.log(`[LegendaryV2] Flying to inlet: ${inlet.name}`);
    }
  }, [map, selectedInletId]);
  
  // Handle tutorial completion
  const handleTutorialComplete = () => {
    localStorage.setItem('abfi_tutorial_seen', 'true');
    setShowingTutorial(false);
    setTutorialCompleted(true);
  };
  
  // Log map status
  console.log('[LegendaryV2] Map status:', map ? 'Ready' : 'Waiting...');
  
  // Don't wait for map - render UI anyway
  // The map will be passed when ready
  
  return (
    <>
      {/* Tutorial Overlay */}
      {showingTutorial && (
        <InteractiveTutorial 
          onComplete={handleTutorialComplete}
        />
      )}
      
      {/* Ocean Layers - only render if map exists */}
      {map && (
        <>
          <SSTLayer 
            map={map}
            on={sstActive}
            selectedDate={selectedDate}
          />
          
          <CoastlineSmoother 
            map={map}
            enabled={true}
          />
        </>
      )}
      
      {/* UI Overlays */}
      <div className="pointer-events-none absolute inset-0">
        {/* Command Bar (top) */}
        <UnifiedCommandBar
          map={map}
          activeTab="analysis"
          onTabChange={(tab) => console.log('Tab changed to:', tab)}
        />
        
        {/* TODO: Add LeftZone and RightZone with proper props */}
        
        {/* TODO: Add UnifiedRightPanel with proper props */}
        
        {/* ABFI Button */}
        {!isAnalysisModalOpen && (
          <div className="absolute bottom-6 right-6 pointer-events-auto z-50">
            <ReportCatchButton 
              map={map}
              boatName={boatName}
              inlet={selectedInletId}
            />
          </div>
        )}
        
        {/* Inlet Regions */}
        <InletRegions map={map} />
      </div>
    </>
  );
}
