# 🚀 ALWAYS BENT - Deployment Guide

## 🎯 Branch Strategy (Simple & Safe)

### Branches:
- **`main`** → Production (`alwaysbent.com`) - LIVE for users
- **`staging`** → Testing (`staging.alwaysbent.com`) - Safe testing  
- **`dev`** → Development - Active work

### Rules:
- **NEVER push directly to `main`**
- **ALWAYS test on `staging` first**
- **Claude pushes to `staging` → You promote to `main`**

---

## 🔄 Deployment Workflow

### When Claude Makes Changes:

1. **Claude pushes to `staging` branch**
2. **Vercel auto-deploys to staging domain**
3. **You test at: `staging.alwaysbent.com`**
4. **If good → You promote to production**
5. **If issues → Claude fixes on staging**

### Your Actions:

#### ✅ TO TEST NEW FEATURES:
```
Go to: staging.alwaysbent.com
Test everything works
```

#### ✅ TO GO LIVE:
```
Vercel Dashboard → Find staging deployment → "Promote to Production"
```

#### ✅ IF BROKEN:
```
Tell Claude: "Fix XYZ on staging"
Claude will push fix to staging
Test again
```

---

## 🌊 Environment Setup

### Production (`alwaysbent.com`):
```
# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiamVmZmpyODI4ODYiLCJhIjoiY21mOGw5bjJiMTFrZjJqcG40OGdueDg3ciJ9.bHHUsesnpWxWy271quBUYQ

# === COPERNICUS MARINE DATA ===
COPERNICUS_USER=your_copernicus_username
COPERNICUS_PASS=your_copernicus_password
CMEMS_SST_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts/SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001/cmems_obs-sst_glo_sst_l4_nrt_0.05deg_PT1H?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cmems_obs-sst_glo_sst_l4_nrt_0.05deg_PT1H&STYLE=default&FORMAT=image/png&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}
NEXT_PUBLIC_SST_TILES_URL=/api/tiles/sst/{z}/{x}/{y}.png

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xocxmgovdfrfdoicpovf.supabase.co/
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvY3htZ292ZGZyZmRvaWNwb3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODQxNjAsImV4cCI6MjA3MDk2MDE2MH0.Pe0rt8xqje6c2iH87_o6KAEV4Hdc5gFCid8gHmBh_y0
```

### Staging (Same as Production):
```
[Same environment variables as production for realistic testing]
```

---

## 🎯 Simple Rules

### For You:
- **Test on staging first** (always safe)
- **Promote to production** when happy
- **Never worry about breaking anything**

### For Claude:
- **Push all changes to `staging`**
- **Tell you when ready to test**
- **Fix issues on staging until perfect**
- **Only promote to main when you approve**

---

## 🚀 Emergency Procedures

### If Production Breaks:
1. **Vercel Dashboard → Deployments**
2. **Find last working deployment**  
3. **Click "Promote to Production"**
4. **Tell Claude what broke**

### If Staging Breaks:
1. **No problem! Production still works**
2. **Tell Claude to fix it**
3. **Test again when ready**

---

## ✅ Success Checklist

### Before Going Live:
- [ ] Staging deployment successful
- [ ] SST thermal visualization working
- [ ] Polygons rendering properly  
- [ ] No console errors
- [ ] Performance good (< 3s load)
- [ ] Mobile responsive

### After Going Live:
- [ ] Production domain working
- [ ] All features functional
- [ ] Analytics tracking
- [ ] Error monitoring active

---

## 🌊 ALWAYS BENT - Ready to Change the Ocean Industry!

**Powered by Claude & Cursor • Built with Jeff's Ocean Expertise • Driven by Your Vision**
