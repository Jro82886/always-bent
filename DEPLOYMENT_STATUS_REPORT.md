# Deployment Status Report
Generated: 2025-09-25T01:09:37.563Z

## 🟢 Current Production Status
- **URL**: https://always-bent.vercel.app
- **Deployment ID**: iad1::dpw4v-1758762577744-02ff...
- **Latest Commit**: cae214f8 (main)
- **Health**: ✅ All automated checks passing

## 📊 Today's Changes Summary (Sept 24, 2025)

### ✅ Successfully Deployed Features:
1. **Vessels Integration** (PR #6) - Shows placeholder "no vessel information available"
2. **Save Report to Reprott** (PR #7/8) - Functional with route to `/legendary/reprott/reports/{id}`
3. **Map Chrome Spacing** (PR #9) - Settings gear top-right, Beta button bottom
4. **Pixelation Enforcement** (PR #12) - SST/CHL using 'nearest' resampling
5. **Service Worker Fix** (PR #13) - Disabled via NEXT_PUBLIC_ENABLE_SW

### ⚠️ Incomplete/Reverted Items:
1. **CTA Duplicate Issue** (PR #10) - Temporarily reverted, duplicates still showing
2. **SoT Unification** (PR #11) - Only initialized, not implemented
3. **Error Boundaries** - Only on Analysis/Tracking, missing on Community/Trends

## 🔍 What's Currently Live:

### Working Features:
- ✅ Main navigation between tabs
- ✅ Analysis page with map
- ✅ SST/CHL layer toggles (pixelated display)
- ✅ Snip tool drawing
- ✅ Extended analysis card
- ✅ Save Report functionality
- ✅ Authentication flow (when ABFI_AUTH_MODE=hard)

### Known Issues:
- ⚠️ Duplicate CTAs may appear (Review analysis chip)
- ⚠️ Vessel data shows placeholder text only
- ⚠️ SoT not unified (using old pendingAnalysis/narrative structure)

## 📋 Environment Variables to Verify:
```
NEXT_PUBLIC_ENABLE_SW=false (critical!)
ABFI_AUTH_MODE=soft or hard
NEXT_PUBLIC_MAPBOX_TOKEN
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
MEMBERSTACK_PUBLIC_KEY
MEMBERSTACK_SECRET_KEY
ABFI_APP_SECRET
GFW_API_TOKEN
```

## 🎯 Next Steps for Polish:
1. Fix CTA duplicates properly
2. Complete SoT unification
3. Add error boundaries to Community/Trends
4. Wire real vessel data when available
5. Test auth flow end-to-end

## 🧪 Manual Testing Needed:
- [ ] Draw snip → see analysis → save report → view in Reprott
- [ ] Toggle SST/CHL → verify pixelated (not blurred)
- [ ] Change inlets → map doesn't auto-zoom
- [ ] Settings gear doesn't overlap zoom controls
- [ ] Auth redirect works (if ABFI_AUTH_MODE=hard)
