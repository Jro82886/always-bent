# 🔒 ABFI Stabilization & Enhancement Plan

## Overview
This document outlines the critical stabilization tasks to lock in the polished Community & Trends experiences before scaling. Follow this plan to ensure consistency, performance, and maintainability.

---

## 🎯 GitHub Issues (Copy-Paste Ready)

### Issue #1: Reports Stabilization ✅
**Priority: HIGH**

- [ ] Add scroll containers to My Snipped Reports + My ABFI Bite Reports (`max-h-[70vh] overflow-y-auto`)
- [ ] Wire Month filter buttons to actually filter by `created_at`
- [ ] Add Species filter chips (multi-select, URL synced, server query `contains`)
- [ ] Ensure DB indexes exist: `created_at`, `(type, created_at)`, `GIN(species)`
- [ ] Expand card → full analysis, notes, species pills update instantly
- [ ] Confirm "ABFI button" is removed here (exists only on Analysis desktop + mobile)

**Acceptance Criteria:**
- Filters persist in URL (`?month=2025-09&species=yellowfin-tuna,mahi`)
- Both columns (Snips & ABFI Bites) respect filters
- Smooth scrolling without layout shift
- Species pills save without page refresh

---

### Issue #2: Community Stabilization 🚀
**Priority: HIGH**

- [ ] Restore RoomBar above message feed; keep page header in own row
- [ ] Implement group mentions: `@eastcoastchat`, `@tunachat`, `@offshorechat`, `@inshorechat`
  - [ ] Parse + store as `{users:[], groups:[]}`
  - [ ] Notify group members
  - [ ] Render as glowy pills
  - [ ] Tooltip: "Notify everyone in {Channel Name}"
- [ ] Standardize channel header → show `@offshorechat` (no #), styled same as mentions
- [ ] Online Now: avatar click = open/create DM; tooltip = "Direct Message {Captain Name}"
- [ ] Direct Messages button: routes to DM view, left rail shows DM threads, RoomBar reflects DM
- [ ] Keep ABFI Highlights reel in right rail

**Acceptance Criteria:**
- Channel mentions consistent in header + sidebar + messages
- DM flow works end-to-end
- Tooltips appear on hover/long-press
- No emerald glow clipping on avatars

---

### Issue #3: Design System Reinforcement 🎨
**Priority: MEDIUM**

- [ ] Lock color tokens:
  - Inlet colors = strips/dots only (chrome accents)
  - Species colors = filled glowing pills only (content tags)
  - Group mentions = fixed channel palette (teal, blue, violet, emerald)
- [ ] Add Storybook stories for:
  - [ ] Card, CardHeader
  - [ ] Mention pill (4 variants)
  - [ ] Species pill (8 variants)
  - [ ] Inlet strip/dot
  - [ ] RoomBar
  - [ ] Avatar (online/offline states)
- [ ] Gradient class (orange/yellow from ABFI Highlights) reused for:
  - "INTELLIGENCE"
  - "collective fishing intelligence"
  - "WISDOM"
- [ ] Typography: slightly larger font for Reports slogan header

**File: `src/lib/design-tokens.ts`**
```typescript
export const DESIGN_TOKENS = {
  // Inlet colors - CHROME ONLY (strips/dots)
  inlets: {
    'ny-montauk': '#00DDEB',
    'nj-barnegat': '#FFB700',
    // ... etc
  },
  
  // Species colors - CONTENT ONLY (pills)
  species: {
    'yellowfin-tuna': '#FFD54F',
    'bluefin-tuna': '#4FC3F7',
    // ... etc
  },
  
  // Channel mentions - DISTINCT PALETTE
  mentions: {
    eastcoast: { color: '#00C7B7', bg: 'rgba(0,199,183,0.15)', glow: '#00C7B777' },
    tuna: { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', glow: '#3B82F677' },
    offshore: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)', glow: '#8B5CF677' },
    inshore: { color: '#22C55E', bg: 'rgba(34,197,94,0.15)', glow: '#22C55E77' },
  }
};
```

---

### Issue #4: Performance & Safeguards 🛡️
**Priority: HIGH**

- [ ] Add realtime dedupe + reconnect backoff
- [ ] Confirm rate limits:
  - message: 1 / 2s
  - DM: 1 / 2s  
  - report: 1 / 30s
- [ ] Add event logging:
  - `message_sent`
  - `dm_opened`
  - `mention_group`
  - `report_bite_created`
  - `species_tagged`
  - `month_filter_used`
- [ ] Hook Sentry for frontend + API
- [ ] Supabase RLS checks:
  - messages, dm_messages: read/write only if member
  - dm_threads, dm_members: select only if member
  - reports: owner read/write

**Database Indexes:**
```sql
-- Community
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC);
CREATE INDEX idx_dm_messages_thread_created ON dm_messages(thread_id, created_at DESC);

-- Reports  
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_type_created_at ON reports(type, created_at DESC);
CREATE INDEX idx_reports_species ON reports USING GIN(species);
```

---

### Issue #5: QA & Release Hygiene ✅
**Priority: MEDIUM**

- [ ] Test filters (month + species) in both Snips and ABFI Bites columns
- [ ] Test mentions: group pings correct members, tooltips show
- [ ] Test DM: avatar click → DM thread opens; Direct Messages button → DM list
- [ ] Verify offline bite capture queues + syncs when back online
- [ ] Schedule DB backup before enabling DMs + species
- [ ] Tag release in Vercel + add changelog

**QA Checklist:**
```
Community:
□ Switch channels → RoomBar updates, scroll preserved
□ @tunachat mention → notifies Tuna Chat members
□ Avatar click → opens DM
□ Right rail cards render properly

Reports:
□ Lists scroll smoothly (no shift)
□ Month + Species filter both columns
□ Species pills save instantly
□ Inlet strips ≠ species pills (visually distinct)
```

---

## 🚀 Implementation Order

1. **Week 1: Core Fixes**
   - Reports scrolling + filters
   - Chat RoomBar + mentions
   - Database indexes

2. **Week 2: Polish & Guards**
   - Design system stories
   - Rate limits
   - Event logging
   - Sentry integration

3. **Week 3: QA & Ship**
   - Full QA pass
   - Performance testing
   - Backup + deploy

---

## 🎨 Visual Rules (NEVER BREAK THESE)

### Inlet Colors = Chrome Only
```css
/* YES - Chrome accents */
.abfi-inlet-strip { background: var(--inlet-color); }
.abfi-inlet-dot { background: var(--inlet-color); }

/* NO - Never fill content */
.species-pill { background: var(--inlet-color); } /* WRONG! */
```

### Species Colors = Content Only
```css
/* YES - Content tags */
.abfi-species-pill { background: var(--species-color); }

/* NO - Never use for chrome */
.report-header { border-color: var(--species-color); } /* WRONG! */
```

### Channel Mentions = Distinct Palette
```css
.abfi-mention-tuna { color: #3B82F6; background: rgba(59,130,246,0.15); }
.abfi-mention-offshore { color: #8B5CF6; background: rgba(139,92,246,0.15); }
/* etc - NEVER mix with inlet/species colors */
```

---

## 📊 Success Metrics

- **Performance**: Time to first render < 1s
- **Reliability**: Error rate < 0.1%
- **Engagement**: Daily active rooms > 50
- **Quality**: Zero visual regression reports

---

## 🔐 Security Checklist

- [ ] RLS policies tested with different user roles
- [ ] Rate limits prevent spam
- [ ] Input sanitization on all user content
- [ ] CORS configured correctly
- [ ] Environment variables never exposed

---

This plan ensures ABFI scales smoothly while maintaining the polished experience captains love! 🎣
