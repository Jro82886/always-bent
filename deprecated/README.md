# Deprecated Analysis/Snip Code

This directory contains legacy code that was moved during the Analysis/Snip surgical scrub on 2025-01-22.

## Why These Files Were Moved

The Analysis flow was refactored to have a single, clean path:
- Draw → Zoom → Review CTA → Modal (with narrative) → Save/Share

These legacy files were interfering with the new flow by:
- Using mock data instead of real API calls
- Having duplicate snip controllers
- Using old analysis types
- Creating conflicting UI paths

## What Was Moved

### Components
- `SnipController.tsx` - Old controller that used mock data and legacy analysis
- `AnalysisModal.legacy.tsx` - Old modal implementation

### Analysis Code
- `sst-analyzer.ts` - Old analyzer with mock data generators
- `ml-fishing.ts` - Legacy analysis types (kept LegacySnipAnalysis for compatibility)
- `legacy-adapter.ts` - Adapter between old and new types

### Other Files
- Old narrative builders that don't match the new format
- Mock data generators
- Duplicate handlers

## Current Implementation

The new implementation uses:
- `src/components/SnipTool.tsx` - Single source of truth for snip control
- `src/components/AnalysisModal.tsx` - New modal with proper narrative display
- `src/lib/analysis/types.ts` - New, simpler SnipAnalysis type
- `src/lib/analysis/narrative-builder.ts` - Returns 3-6 line narratives
- Zustand store in `src/lib/store.ts` - analysis slice for state management

## Rollback Instructions

If you need to restore any of these files:
1. Copy the file from this directory back to its original location
2. Update imports to point to the restored file
3. Test thoroughly as the new flow may have diverged

## Notes

- These files are kept for reference and potential rollback
- Do not import from this directory in production code
- Consider fully deleting after the new flow is stable for 30 days
