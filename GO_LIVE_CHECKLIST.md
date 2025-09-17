# ABFI GO LIVE CHECKLIST
## Production Deployment Guide for 60+ Users

---

## AUTHENTICATION FLOW

### Squarespace Integration Setup
**URL:** `app.alwaysbent.com/auth/signup`  
**Location:** Separate page behind Squarespace paywall

### User Flow:
1. **Squarespace** → User pays for membership
2. **Redirect** → `app.alwaysbent.com/auth/signup?from=squarespace`
3. **One-time setup** → User creates ABFI credentials (Captain name, Boat name, Email, Password)
4. **Session** → Stays logged in for 30 days (configurable)
5. **Return visits** → Direct to app, no login required

### Squarespace Button Code:
```html
<a href="https://app.alwaysbent.com/auth/signup?from=squarespace&email={{customer.email}}" 
   class="button">
   Access ABFI Command Bridge →
</a>
```

---

## PRE-LAUNCH CHECKLIST

### 1. DOMAIN & HOSTING
- [ ] Configure `app.alwaysbent.com` subdomain
- [ ] Point to Vercel deployment
- [ ] SSL certificate active
- [ ] DNS propagation complete

### 2. ENVIRONMENT VARIABLES
- [x] NEXT_PUBLIC_SUPABASE_URL ✓
- [x] NEXT_PUBLIC_SUPABASE_ANON_KEY ✓
- [x] SUPABASE_SERVICE_ROLE_KEY ✓
- [x] NEXT_PUBLIC_MAPBOX_TOKEN ✓
- [x] DATABASE_URL ✓
- [x] All ocean data API keys ✓

### 3. SUPABASE DATABASE
- [x] Run migration: `001_initial_schema.sql`
- [x] Verify tables created:
  - profiles ✓
  - vessel_tracks ✓ (instead of vessel_positions)
  - hotspot_intelligence ✓
  - catch_reports ✓
  - snip_analyses ✓
- [x] Performance indexes created
- [ ] Test authentication flow
- [ ] Verify RLS policies active

### 4. SQUARESPACE SETUP
- [ ] Add ABFI button to member area
- [ ] Configure post-payment redirect
- [ ] Test payment → ABFI flow
- [ ] Verify email pre-fill works

---

## DEPLOYMENT STEPS

### STEP 1: Database Setup
```bash
# 1. Go to Supabase SQL Editor
https://supabase.com/dashboard/project/xocxmgovdfrfdoicpovf/sql/new

# 2. Run migrations
# Copy contents of supabase/migrations/001_initial_schema.sql
# Paste and execute

# 3. Verify tables created
```

### STEP 2: Deploy to Production
```bash
# 1. Push to main branch
git push origin main

# 2. Vercel auto-deploys
# Monitor at: https://vercel.com/dashboard

# 3. Verify deployment
curl https://app.alwaysbent.com/api/health
```

### STEP 3: Configure Squarespace
1. Log into Squarespace admin
2. Navigate to Member Areas
3. Add Custom Code block
4. Insert ABFI button code
5. Save and publish

### STEP 4: Test End-to-End
1. Create test Squarespace purchase
2. Verify redirect to ABFI signup
3. Create test account
4. Verify 30-day session persistence
5. Test all app modes

---

## FEATURES STATUS

### COMPLETED & DEPLOYED
- [x] Authentication system (60+ users)
- [x] Squarespace integration  
- [x] Session management (30-day persistence)
- [x] Session warnings
- [x] Welcome dashboard
- [x] Remember Me feature
- [x] Real SST/CHL pixel extraction
- [x] SnipTool tooltip persistence

### PENDING DEPLOYMENT
- [ ] Location services (on-water detection)
- [ ] Real-time user visibility
- [ ] Ocean features (edges, eddies, filaments)
- [ ] ABFI bite button
- [ ] Comprehensive report generation

---

## MONITORING & SUPPORT

### Health Checks
- **API Status:** `app.alwaysbent.com/api/health`
- **Database:** Supabase Dashboard → Database Health
- **Auth Flow:** Monitor signup success rate
- **Session Duration:** Check average session length

### Support Procedures
1. **Login Issues**
   - Check Supabase auth logs
   - Verify user in profiles table
   - Reset password if needed

2. **Session Problems**
   - Clear localStorage
   - Force refresh token
   - Re-authenticate

3. **Data Issues**
   - Check Supabase logs
   - Verify RLS policies
   - Check network connectivity

---

## LAUNCH DAY PROTOCOL

### T-24 Hours
- [ ] Final code review
- [ ] Backup current production
- [ ] Test all critical paths
- [ ] Prepare rollback plan

### T-2 Hours  
- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Verify all services online
- [ ] Monitor error logs

### T-0 Launch
- [ ] Enable Squarespace button
- [ ] Monitor first users
- [ ] Track signup metrics
- [ ] Be ready for support

### T+24 Hours
- [ ] Review analytics
- [ ] Address any issues
- [ ] Gather user feedback
- [ ] Plan improvements

---

## CRITICAL CONTACTS

### Technical
- Vercel Dashboard: [vercel.com/dashboard]
- Supabase Project: [supabase.com/dashboard/project/xocxmgovdfrfdoicpovf]
- GitHub Repo: [github.com/Jro82886/always-bent]

### DNS & Domain
- Domain registrar: [Your registrar]
- DNS provider: [Your DNS provider]

---

## ROLLBACK PROCEDURE

If critical issues arise:

1. **Immediate:** Disable Squarespace button
2. **Revert Code:** `git revert HEAD && git push`
3. **Database:** Restore from Supabase backup
4. **Communicate:** Notify affected users
5. **Fix:** Address issue in development
6. **Re-deploy:** Follow deployment steps

---

## SUCCESS METRICS

### Day 1
- [ ] 10+ successful signups
- [ ] < 5% error rate
- [ ] Average session > 10 minutes

### Week 1  
- [ ] 50+ active users
- [ ] < 2% support tickets
- [ ] Positive user feedback

### Month 1
- [ ] 60+ registered users
- [ ] 80% return rate
- [ ] Feature adoption > 60%

---

## NOTES SECTION
*Add important notes here as we progress*

- Authentication uses Supabase with 30-day session persistence
- Squarespace members get pre-filled email on signup
- All ocean data is real-time from Copernicus/NASA
- System designed for 60+ concurrent users

---

*Last Updated: [Auto-updates with each edit]*
*Version: 1.0.0*
