"use client";
import type mapboxgl from "mapbox-gl";
import SnipTool from "@/components/SnipTool";
import type { AnalysisResult } from '@/lib/analysis/sst-analyzer';

export default function SnipAnalyzeControl({ map }: { map: mapboxgl.Map }) {
  const handleAnalysisComplete = (analysis: AnalysisResult) => {
    // Handle the analysis result - for now just log it
    
  };

  return <SnipTool map={map} onAnalysisComplete={handleAnalysisComplete} />;
}


