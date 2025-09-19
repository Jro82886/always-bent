# ✅ ABFI Merge Checklist (Stable MVP)

Every merge into main must pass all four sections below.  
If anything fails, stop and fix surgically before declaring "done."

---

## 0) Build Sanity
- [ ] `pnpm i`
- [ ] `pnpm ts --noEmit` → zero errors
- [ ] `pnpm build` → succeeds locally

---

## 1) Guardrails / Grep Checks

Run guardrails or CI script:

```bash
# Inlet contract: no inlet-triggered camera or layer flips
rg -n "(fitBounds|flyTo|easeTo).*(inlet|selectedInlet)|(inlet|selectedInlet).*(fitBounds|flyTo|easeTo)" src
rg -n "selectedInlet(Id)?.*(toggle|set.*Visibility|set.*Opacity)" src

# Land Guard: no GPS → auto-inlet
rg -n "gps|geoloc|position|location" src | rg -n "setSelectedInlet|selectedInlet"
```

Or run:
```bash
pnpm run lint:contracts
```

- [ ] No matches found
- [ ] CI guardrail passes

---

## 2) 5-Minute UI QA

### A) First load & Command Bridge
- [ ] Load fresh tab → East Coast overview, no inlet
- [ ] Inlet dropdown visible above layers, dark/blur, glow colors (no purple/pink), searchable + keyboardable
- [ ] Select inlet → URL updates; camera does not move; weather updates
- [ ] Reload → inlet persists; camera still EC overview

### B) Layers & Legend
- [ ] Toggle SST ON → compact legend shows only when ON
- [ ] Toggle CHL ON → Mid-CHL highlight, no purple/pink
- [ ] Toggle GFW ON → vessels show globally
- [ ] Commercial Vessels legend identical in Analysis + Tracking; collapsible & attached to toggle

### C) Tracking gates + Land Guard
- [ ] No inlet → Location/Track disabled + helper text
- [ ] Inlet + Location ON + on land outside inlet → no dot/track + toast once
- [ ] Inlet + Location ON + on land inside inlet → dot/track OK
- [ ] At sea → dot/track OK; inlet never auto-changes

### D) Camera sanity
- [ ] Reset View → EC overview (only allowed programmatic move)
- [ ] Inlet/date/toggle changes never move camera

---

## 3) Deployment Hygiene
- [ ] Vercel build is green
- [ ] Purge CDN Cache + Purge Data Cache in Vercel
- [ ] Smoke test prod URL with steps from section 2

---

## 4) Post-Merge Monitoring
- [ ] Console clear of warnings
- [ ] No unexpected 4xx/5xx on weather/GFW requests
- [ ] CI guardrails continue blocking regressions

---

## ✅ Exit Criteria

**Stable MVP = all boxes checked.**  
If anything fails → fix surgically, re-run checklist.

---

👉 **Please confirm every item on the merge checklist is green on main.**
