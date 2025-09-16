# 🚀 ABFI LAUNCH CHECKLIST

## 🔒 PRIVACY COMMITMENT
**ABFI's privacy features are NOT compromised - they're just temporarily disabled for testing.**

### Our Privacy Principles (Still Intact):
1. **Water-Only Tracking** - Location is NEVER tracked on land in production
2. **Inlet-Based Visibility** - Users only visible when at their selected inlet (40-mile radius)
3. **Share to See** - Must share your location to see others
4. **No Home Tracking** - Protects users' home/marina locations
5. **Opt-in Only** - Location sharing is always user choice

### Why Testing Mode Exists:
- **Verify GPS works** from your house/office during development
- **Test real-time updates** without going to sea
- **Debug tracking** with someone on a boat while you're on land
- **Confirm data flow** before production deployment

# 🚀 ABFI LAUNCH CHECKLIST

## ⚠️ CRITICAL: Testing Flags to Disable Before Production

### 1. **Location Privacy Settings** 
**FILE:** `/src/components/tracking/VesselLayer.tsx`
- **Line 153:** Change `const TESTING_MODE = true;` to `const TESTING_MODE = false;`
- **Line 432:** Change `const TESTING_MODE = true;` to `const TESTING_MODE = false;`
- **Effect:** This will re-enable privacy protection that:
  - Only shows user location when over water (east of coastline)
  - Only shows user location when within 40 miles of selected inlet
  - Hides location when on land or at home

### 2. **Update UI Messages**
**FILE:** `/src/components/tracking/UnifiedTrackingPanelLeft.tsx`
- **Line 118-120:** Change from:
  ```tsx
  <div className="text-xs text-green-400/80 mt-1">
    TESTING: Location visible everywhere
  </div>
  ```
  To:
  ```tsx
  <div className="text-xs text-orange-400/60 mt-1">
    Location hidden until at inlet
  </div>
  ```

## 📋 Pre-Launch Testing Checklist

### Location Services Testing
- [ ] Test with someone on a boat going out to sea
- [ ] Verify location shows when at inlet (within 40 miles)
- [ ] Verify location hides when on land
- [ ] Verify location hides when too far from inlet
- [ ] Test auto-select closest inlet feature works

### Features to Verify
- [ ] SST layer loads and displays correctly
- [ ] CHL layer loads and displays correctly
- [ ] Analysis mode snip tool works
- [ ] Inlet selection flies to correct Gulf Stream bounds
- [ ] Fleet vessels show with correct inlet colors
- [ ] Vessel tracks display properly
- [ ] Welcome screen saves captain/boat names

### Environment Variables
- [ ] All production environment variables are set on Vercel
- [ ] Mapbox token is working
- [ ] Supabase credentials are correct
- [ ] Ocean data API endpoints are configured

## 🔍 Things That Might Look "Broken" But Are Actually Working

1. **"I can't see my location!"**
   - This is CORRECT if you're on land or far from an inlet
   - Location only shows when at sea near selected inlet
   - This is a privacy feature, not a bug

2. **"The fleet vessels aren't showing!"**
   - Fleet only shows when YOU share location
   - It's a "share to see" system
   - Both users need location enabled

3. **"SST/CHL layers are slow to load"**
   - These are large satellite datasets
   - First load can take 5-10 seconds
   - They cache after first load

4. **"I selected an inlet but map didn't move"**
   - Check if you have SST/CHL layers active
   - You must turn off layers before switching inlets
   - This prevents incomplete tile loading

## 🎯 Final Production Steps

1. **Disable all testing modes** (see above)
2. **Clear browser cache** before testing production
3. **Test on multiple devices:**
   - Desktop browser
   - Mobile browser (iPhone/Android)
   - Different screen sizes

4. **Monitor console for errors:**
   - Open browser dev tools (F12)
   - Check for any red errors
   - Yellow warnings are usually OK

## 📱 Mobile Testing Specific

- Location permission prompt appears
- GPS accuracy might vary (normal)
- Tracking works in background
- Battery usage is optimized
- Works on both WiFi and cellular

## 🆘 Quick Fixes for Common Issues

**Location not working:**
- Check browser location permissions
- Check device location services enabled
- Try refreshing the page
- Clear site data and re-login

**Map not loading:**
- Check internet connection
- Verify Mapbox token is valid
- Check browser console for errors

**Data layers not showing:**
- Toggle layer off and on
- Check date selection
- Verify API endpoints are up

## 📞 Support Contacts

Add your support contacts here:
- Technical issues: [Your contact]
- API/Backend issues: [Backend contact]
- Emergency fixes: [Emergency contact]

---

## ✅ FINAL CHECKLIST

- [ ] All testing flags set to false
- [ ] Environment variables verified
- [ ] Tested on real boat at sea
- [ ] Tested privacy (location hidden on land)
- [ ] Welcome flow works for new users
- [ ] All 4 modes accessible (Analysis, Tracking, Community, Trends)
- [ ] Deployment successful on Vercel
- [ ] Domain pointing correctly
- [ ] SSL certificate active

**REMEMBER:** It's normal to feel nervous at launch! Most "issues" are just the privacy features working correctly. The app is designed to protect user privacy by default.

---

*Last updated: [Current Date]*
*Version: 1.0.0*
