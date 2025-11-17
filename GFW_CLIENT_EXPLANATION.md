# Global Fishing Watch (GFW) - Client Explanation

**For: Amanda (Client)**
**Subject: Commercial Vessel Tracking Limitation**
**Date: 2025-11-18**

---

## Simple Explanation

The Global Fishing Watch (GFW) API is designed to track **specific, known vessels** by their unique identifiers. Unfortunately, it does not support the ability to search for **"all vessels within a geographic area"** (like our snip tool does). This is a limitation of their service's architecture, not a bug in our code.

To display commercial vessels on the map, we would need to either: (1) upgrade to GFW's enterprise API tier (if geographic search is available), (2) integrate with a different vessel tracking service that supports location-based queries, or (3) implement a backend system that periodically caches vessel data from GFW and serves it to our app.

---

## Technical Details (For Reference)

**What Works:**
- GFW `/v3/vessels/search` - Returns list of vessels globally
- GFW `/v3/events` - Returns vessel events (fishing activity, port visits)

**What Doesn't Work:**
- No `bbox` (bounding box) parameter for geographic filtering
- No lat/lng radius search
- Events endpoint REQUIRES vessel IDs (can't query by location alone)

**API Design:**
- Built for vessel-centric queries: "Show me where vessel XYZ has been"
- NOT built for location-centric queries: "Show me all vessels in this area"

**Attempted Workarounds:**
- Querying all vessels, then filtering by location → Would require 100+ API calls per map load (too slow, would hit rate limits)

**Documented In:**
- `/CRITICAL-API-ISSUES.md` (lines 1-90)
- `/src/app/api/gfw/vessels/route.ts` (implementation attempts)

---

## Recommendations

### Option 1: Alternative AIS Data Provider (Recommended)
- **MarineTraffic API** - Supports geographic queries
- **VesselFinder API** - Location-based vessel search
- **Cost:** ~$50-200/month depending on call volume
- **Timeline:** 2-3 days to integrate

### Option 2: GFW Enterprise Tier
- **Contact GFW** to inquire about enterprise features
- May have geographic query capabilities
- **Cost:** Unknown (need to contact sales)
- **Timeline:** 1-2 weeks (inquiry + potential integration)

### Option 3: Backend Caching System
- Periodically fetch GFW data (daily/hourly cron job)
- Store in Supabase with PostGIS spatial indexing
- Serve cached data to frontend
- **Cost:** No additional API costs
- **Downside:** Data is not real-time (delayed by caching interval)
- **Timeline:** 1 week to implement

---

## Current Status

**Feature:** "Commercial Vessel Activity"
**Display:** "No Commercial Activity" (even in active fishing areas)
**Cause:** GFW API architectural limitation
**User Impact:** Users cannot see other boats on the map

---

## Recommendation Summary

**Best Path Forward:** Integrate MarineTraffic or VesselFinder API
- Real-time data
- Geographic search supported
- Proven reliability
- Cost-effective for MVP

**Next Steps:**
1. Client decision: Approve budget for AIS provider (~$50-100/month)
2. Evaluate MarineTraffic vs VesselFinder APIs
3. Implement integration (2-3 days)
4. Deploy and test

---

**Would you like us to proceed with Option 1 (MarineTraffic/VesselFinder), or would you prefer to explore Options 2 or 3?**
