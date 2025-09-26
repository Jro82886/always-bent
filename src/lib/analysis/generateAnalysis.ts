import type { AnalysisVM } from '@/types/analyze';

export function generateAnalysisText(vm: AnalysisVM): string {
  if (!vm || (!vm.sst && !vm.chl)) {
    return "No ocean data available for this area.";
  }

  const sections: string[] = [];
  
  // Temperature Analysis
  if (vm.sst) {
    const { meanF, minF, maxF, gradFperMile } = vm.sst;
    let tempAnalysis = `**Temperature Profile**\n`;
    tempAnalysis += `• Current: ${meanF.toFixed(1)}°F\n`;
    tempAnalysis += `• Range: ${minF.toFixed(1)}°F - ${maxF.toFixed(1)}°F\n`;
    
    // Temperature gradient analysis
    if (gradFperMile > 2.0) {
      tempAnalysis += `• **Strong temperature break detected**: ${gradFperMile.toFixed(1)}°F/mile gradient\n`;
      tempAnalysis += `• Action: Target the edge where warm and cool water meet\n`;
    } else if (gradFperMile > 0.5) {
      tempAnalysis += `• Moderate gradient: ${gradFperMile.toFixed(1)}°F/mile\n`;
      tempAnalysis += `• Potential feeding edge present\n`;
    } else {
      tempAnalysis += `• Uniform temperature (${gradFperMile.toFixed(1)}°F/mile)\n`;
    }
    
    // Temperature-based species targeting
    if (meanF > 78) {
      tempAnalysis += `• Optimal for: Mahi, Wahoo, Blue Marlin\n`;
    } else if (meanF > 72) {
      tempAnalysis += `• Optimal for: Yellowfin Tuna, Sailfish\n`;
    } else if (meanF > 68) {
      tempAnalysis += `• Optimal for: Bigeye Tuna, Swordfish\n`;
    } else {
      tempAnalysis += `• Cool water - target bottom species\n`;
    }
    
    sections.push(tempAnalysis);
  }
  
  // Chlorophyll Analysis
  if (vm.chl) {
    const chl = vm.chl.mean;
    let chlAnalysis = `**Water Quality**\n`;
    chlAnalysis += `• Chlorophyll: ${chl.toFixed(3)} mg/m³\n`;
    
    if (chl < 0.1) {
      chlAnalysis += `• Crystal clear blue water\n`;
      chlAnalysis += `• Low productivity - fish may be scattered\n`;
      chlAnalysis += `• Best for: Sight casting, trolling\n`;
    } else if (chl < 0.3) {
      chlAnalysis += `• Clean green water\n`;
      chlAnalysis += `• Good visibility with baitfish presence\n`;
      chlAnalysis += `• Ideal conditions for most pelagics\n`;
    } else if (chl < 1.0) {
      chlAnalysis += `• Productive green water\n`;
      chlAnalysis += `• High baitfish concentration likely\n`;
      chlAnalysis += `• Prime feeding conditions\n`;
    } else {
      chlAnalysis += `• Very green/turbid water\n`;
      chlAnalysis += `• Reduced visibility but high nutrients\n`;
      chlAnalysis += `• Good for bottom fishing\n`;
    }
    
    sections.push(chlAnalysis);
  }
  
  // Combined Analysis
  if (vm.sst && vm.chl) {
    let tactical = `**Tactical Analysis**\n`;
    
    // Edge detection
    if (vm.sst.gradFperMile > 1.0 && vm.chl.mean > 0.2 && vm.chl.mean < 1.0) {
      tactical += `🎯 **HOTSPOT DETECTED**\n`;
      tactical += `• Temperature break + productive water = prime conditions\n`;
      tactical += `• Focus efforts along the temperature edge\n`;
      tactical += `• Work both sides of the break\n`;
    } else if (vm.sst.gradFperMile > 0.5 || (vm.chl.mean > 0.3 && vm.chl.mean < 0.8)) {
      tactical += `• Good conditions present\n`;
      tactical += `• ${vm.sst.gradFperMile > 0.5 ? 'Temperature variation' : 'Productive water'} suggests active area\n`;
    } else {
      tactical += `• Stable conditions\n`;
      tactical += `• Focus on structure and known productive spots\n`;
    }
    
    // Time of day recommendations
    const hour = new Date().getHours();
    if (hour < 7 || hour > 18) {
      tactical += `• Low light conditions - topwater action likely\n`;
    } else if (hour > 10 && hour < 15) {
      tactical += `• Midday - fish deeper or in shadows\n`;
    } else {
      tactical += `• Prime feeding window\n`;
    }
    
    sections.push(tactical);
  }
  
  // Area info
  sections.push(`**Analysis Area**: ${(vm.areaKm2 * 0.386102).toFixed(1)} sq miles`);
  
  return sections.join('\n\n');
}

// Generate unique fishing recommendations based on exact data values
export function generateFishingTips(vm: AnalysisVM): string[] {
  const tips: string[] = [];
  
  if (vm.sst) {
    const { meanF, gradFperMile, maxF, minF } = vm.sst;
    
    // Temperature-specific tips
    if (gradFperMile > 1.5) {
      tips.push(`Work the ${maxF > meanF + 1 ? 'warm' : 'cool'} side of the temperature break first`);
    }
    
    if (meanF > 75 && meanF < 82) {
      tips.push("Perfect temperature for surface feeding - watch for birds");
    }
    
    if (maxF - minF > 3) {
      tips.push("Temperature variation suggests multiple water masses - try different depths");
    }
  }
  
  if (vm.chl) {
    const chl = vm.chl.mean;
    
    if (chl > 0.2 && chl < 0.6) {
      tips.push("Chlorophyll sweet spot - baitfish should be concentrated");
    }
    
    if (chl < 0.15) {
      tips.push("Clear water - use fluorocarbon leaders and natural colors");
    }
  }
  
  // Combined tips
  if (vm.sst && vm.chl) {
    if (vm.sst.gradFperMile > 0.8 && vm.chl.mean > 0.3) {
      tips.push("🔥 Premium conditions - this is where you want to be!");
    }
  }
  
  return tips;
}
