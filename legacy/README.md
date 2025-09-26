# Legacy Code Archive

This directory contains code that has been replaced but is preserved for reference.

## Moved Files

### Analysis Components
- **SnipTool.tsx** → Replaced by `SimpleSnipTool.tsx` (2025-09-26)
  - Original 2400+ line snipping tool with complex state management
  - Replaced with cleaner 200-line version using MapboxDraw
  
- **DynamicAnalysisModal.tsx** → Integrated into main analysis flow (2025-09-26)
  - Was a separate modal component
  - Now part of the unified analysis experience

### Debug/Test Files
- **analysis-debug.css** → No longer needed (2025-09-26)
  - Temporary debug styles for analysis development
  
- **no-static-analysis.test.tsx** → Test completed its purpose (2025-09-26)
  - Was ensuring no static/mock data in production

## Migration Notes

When restoring or referencing these files:
1. Check git history at tag `pre-scrub-20250926` for full context
2. Most functionality has been reimplemented in cleaner modules
3. Do not directly copy old patterns - they were replaced for good reasons

## Why These Were Archived

The original implementations had several issues:
- Excessive complexity and coupling
- Poor separation of concerns
- Debug code mixed with production
- Static/mock data inadvertently shown to users

The new implementations follow cleaner patterns with:
- Modular architecture
- Clear data flow
- Proper error boundaries
- No mock data in production paths
