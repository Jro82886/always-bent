# Environment Flags Documentation

## Required Flags for Production

### NEXT_PUBLIC_FLAG_REPORTS_CONTRACT
- **Purpose**: Enables the new unified reports system for Snip and Bite reports.
- **Values**: `true` | `false`
- **Default**: `false`
- **Required for**: Save/Share functionality in SnipTool, MyReportsList real data
- **Set in Vercel**: Production + Preview

### NEXT_PUBLIC_FLAG_COMMUNITY_CHAT_DRAWER
- **Purpose**: Enables the chat drawer overlay in Tracking mode.
- **Values**: `true` | `false` 
- **Default**: `false`
- **Required for**: "Talk to your inlet fleet" button to open drawer
- **Set in Vercel**: Production + Preview

### NEXT_PUBLIC_FLAG_USER_LOCATION_RESTRICT_TO_INLET
- **Purpose**: Controls whether the "Show My Vessel" feature restricts the user's displayed location to within the currently selected inlet's boundaries.
- **Values**:
  - `false` (default for testing): The user's vessel dot will be displayed anywhere on the map, regardless of inlet boundaries.
  - `true` (for live mode): The user's vessel dot will only be displayed if their current GPS location is within the polygon of the currently selected inlet. If outside, a toast notification will inform the user.
- **Usage**: Set in `.env.local` for local development or in Vercel environment variables for deployments.
- **Runtime Override**: In development environments, a `RestrictToggle` component (visible with `?debug` URL parameter) allows overriding this flag at runtime for easier testing.

### NEXT_PUBLIC_FLAG_MAP_DEBUG
- **Purpose**: Shows map debug overlay with zoom, center, bearing info.
- **Values**: `true` | `false`
- **Default**: `false`
- **Usage**: Development only, or append `?debug` to URL

## Testing Mode Setup

Add these to your `.env.local` file:

```env
# Enable new reports system
NEXT_PUBLIC_FLAG_REPORTS_CONTRACT=true

# Enable chat drawer in tracking
NEXT_PUBLIC_FLAG_COMMUNITY_CHAT_DRAWER=true

# User Location Privacy Flag
# false = Show My Vessel works anywhere (testing mode)
# true = Show My Vessel only works inside selected inlet bounds (production mode)
NEXT_PUBLIC_FLAG_USER_LOCATION_RESTRICT_TO_INLET=false

# Map debug overlay (dev only)
NEXT_PUBLIC_FLAG_MAP_DEBUG=false
```

## Related Components
- `/src/lib/store.ts` - Manages location state and restriction flags
- `/src/components/tracking/TrackingToolbar.tsx` - Implements Show My Vessel logic
- `/src/components/dev/RestrictToggle.tsx` - Dev-only runtime toggle
- `/src/lib/geo/inletBounds.ts` - Inlet boundary checking utilities
- `/src/lib/flags.ts` - Central flag definitions