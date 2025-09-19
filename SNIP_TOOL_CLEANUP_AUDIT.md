# Snip Tool Cleanup Audit

## ✅ ACTIVE Components (DO NOT DELETE)
These are the core files currently in use:

1. **src/components/SnipController.tsx** - Main orchestrator with hardResetSnip
2. **src/components/SnipTool.tsx** - Handles drawing rectangles
3. **src/components/AnalysisModal.tsx** - Shows the analysis report
4. **src/components/RightZone.tsx** - Contains the hidden SnipController
5. **src/components/UnifiedCommandCenter.tsx** - Has the "Draw Analysis Area" button

## 🗑️ LEGACY/UNUSED Components (Safe to Delete)
These appear to be old implementations not used in the main app:

1. **src/components/SnipOverlay.tsx** - Old overlay system (only used in /v2)
2. **src/components/SnipAnalysisReport.tsx** - Old report component
3. **src/components/SnipAnalysisCard.tsx** - Old analysis card (only used in /v2)
4. **src/components/SnipAnalyzeControl.tsx** - Old control component
5. **src/components/AnalyzeBar.tsx** - Likely old UI component
6. **src/components/UnifiedAnalysisPanel.tsx** - Old unified panel
7. **src/components/AnalysisReportPanel.tsx** - Old report panel
8. **src/components/AnalysisFooterBar.tsx** - Old footer bar

## 🔍 Potential Conflicts to Watch

1. **Multiple "startSnipping" references** - Make sure only one is active
2. **Window object pollution** - We're adding: `__cleanupSnipVisualization`, `__abfiStopDrawing`
3. **Event listeners** - Make sure old ones are cleaned up

## Current Flow (Simplified)
```
UnifiedCommandCenter (button) 
  → RightZone (click handler) 
    → SnipTool (drawing) 
      → SnipController (analysis) 
        → AnalysisModal (report)
```

## Test Checklist for 3x Success
1. ✓ Draw rectangle
2. ✓ See zoom animation
3. ✓ See vessel tracks + legend
4. ✓ Analysis modal opens
5. ✓ "Snip Another Area" works
6. ✓ No artifacts remain after close
7. ✓ Can repeat 3x without issues
