# Snip Tool Debug Plan

## Current Status:
1. ✅ Real SST/CHL pixel extraction connected (no more mock data!)
2. ✅ Weather and moon phase data included in analysis
3. ✅ Jeff's comprehensive hotspot logic is in place
4. ❌ Modal might not be opening automatically
5. ❌ "Squiggle" appears instead of glowing hotspot marker

## Jeff's Hotspot Logic (What Makes a Good Fishing Spot):

### HIGH CONFIDENCE (80-95%):
- **Strong temperature break** (>0.5°F/mile gradient) + vessel activity
- **Multiple fishing reports** + moderate SST gradient (>0.3°F/mile)
- **Commercial vessel concentration** (2+ trawlers/longliners)

### MODERATE CONFIDENCE (60-80%):
- Temperature convergence zones
- Recent fishing reports in area
- Some vessel activity

### Factors Analyzed:
1. **SST Data**: Temperature breaks, gradients, optimal ranges (72-78°F ideal)
2. **Chlorophyll**: Plankton blooms, edges where green meets blue water
3. **Vessel Activity**: 4-day history of recreational + commercial (GFW)
4. **Fishing Reports**: Recent catches, species, success rates
5. **Weather**: Current conditions, wind, waves
6. **Moon Phase**: Affects feeding patterns
7. **Bathymetry**: (Future - depth contours, ledges)

## What Should Happen:
1. Draw rectangle → stays visible (semi-transparent slate blue-grey)
2. Analysis runs with REAL ocean data
3. Hotspot markers appear (glowing yellow/cyan dots)
4. Click rectangle → Modal opens with written analysis
5. Analysis includes all factors + AI recommendations
6. User can: Save analysis, Return to map, or Start new snip

## Debug Steps:
1. Check if modal is actually opening (might be hidden/z-index issue)
2. Verify hotspot markers are being created correctly
3. Ensure click handler on rectangle is working
4. Check console for any errors during analysis

## The Vision:
"Our goal is to see WHY fish are where they are when they are!"
- Multiple ocean factors create patterns
- AI learns from every analysis
- Eventually useful for more than fishing (ocean science!)
