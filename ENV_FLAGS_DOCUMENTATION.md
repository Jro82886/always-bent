# Environment Flags Documentation

## User Location Privacy Flag

Add this to your `.env.local` file:

```env
# User Location Privacy Flag
# false = Show My Vessel works anywhere (testing mode)
# true = Show My Vessel only works inside selected inlet bounds (production mode)
NEXT_PUBLIC_FLAG_USER_LOCATION_RESTRICT_TO_INLET=false
```

### Testing Mode (false)
- Show My Vessel displays your location anywhere on the map
- Useful for development and testing
- No inlet boundary restrictions

### Production Mode (true)
- Show My Vessel only displays location when inside selected inlet bounds
- If outside inlet: shows toast "You're outside the selected inlet. Switch inlets to show your position."
- Privacy-focused: prevents tracking users outside their fishing areas

### Runtime Toggle (Dev Only)
- A dev-only toggle appears at bottom-right when not in production
- Allows switching between modes without restarting the app
- Access with `?debug` query parameter in production
- State persists in localStorage

## Related Components
- `/src/lib/store.ts` - Manages location state and restriction flags
- `/src/components/tracking/TrackingToolbar.tsx` - Implements Show My Vessel logic
- `/src/components/dev/RestrictToggle.tsx` - Dev-only runtime toggle
- `/src/lib/geo/inletBounds.ts` - Inlet boundary checking utilities
