# Inlet Dropdown Functionality Summary

## Current Understanding

### 1. **Inlet Selection System**
The Command Bridge has an inlet dropdown (`InletChip`) that:
- Shows all East Coast inlets organized by state
- Each inlet has a unique color (defined in `src/lib/inlets.ts`)
- Selections sync with URL parameters (`?inlet=md-ocean-city`)
- Updates global state via `useAppState`

### 2. **Overview vs Specific Inlet**

#### **East Coast Overview** (id: 'overview')
- Shows entire East Coast from Maine to Florida
- Map zooms out to show all waters
- **Fleet vessels**: ALL vessels shown with their respective inlet colors
- **Commercial vessels**: Entire East Coast data (7-day history)
- **Legend**: Shows vessels grouped by inlet with color coding

#### **Specific Inlet Selected** (e.g., 'md-ocean-city')
- Map zooms to that inlet's area
- **Fleet vessels**: ONLY vessels from that inlet shown
- **Commercial vessels**: Area around inlet only
- **Legend**: Shows only that inlet's color and vessels

### 3. **Vessel Types & Colors**

#### **Your Vessel** (User)
- Color: Emerald green (#10B981)
- Shows current GPS position
- Track history when enabled

#### **Fleet Vessels** (Recreational boats)
- Color: Based on their home inlet
- Examples:
  - Ocean City, MD: Teal (#059669)
  - Hatteras, NC: Green (#16a34a)
  - Montauk, NY: Red (#dc2626)
- Shows if they have catch reports

#### **Commercial Vessels** (GFW)
- NOT inlet-based colors, type-based:
  - Longliner: Coral red (#FF6B6B)
  - Drifting Longline: Turquoise (#4ECDC4)
  - Trawler: Ocean blue (#45B7D1)

### 4. **How It Works in Each Mode**

#### **Analysis Mode (SnipTool)**
- When area is snipped, shows ALL vessels in that area:
  - Your vessel (if in bounds)
  - Fleet vessels with inlet colors
  - Commercial fishing vessels
- Mini legend shows vessel counts by type/inlet
- Summary includes catch reports

#### **Tracking Mode**
- Real-time vessel positions
- Toggles for each vessel type
- GFW legend only shows when commercial toggle is ON
- Enhanced tracking legend shows:
  - Your vessel status
  - Fleet vessels by inlet (overview) or from selected inlet
  - Vessels with catch reports marked

### 5. **Key Behaviors**

1. **Inlet Selection Effects:**
   - Changes map view/zoom
   - Filters fleet vessels
   - Updates commercial vessel search area
   - Changes legend display

2. **Color System:**
   - Inlet colors: Identify where boats are from
   - Commercial colors: Identify vessel type
   - Never mix the two systems

3. **Reports Integration:**
   - Fleet vessels can have catch reports
   - Shows yellow indicator (●) when reports exist
   - Included in analysis summaries

### 6. **Current Implementation Status**

✅ **Working:**
- Inlet dropdown and selection
- Map view changes
- Color system defined
- Mock fleet vessels with inlet associations

🚧 **Needs Integration:**
- Real fleet vessel data (currently mock)
- Actual catch reports (currently mock flags)
- User GPS tracking (currently mock position)
- Real-time updates via Supabase

The system is designed to give captains a clear view of:
- Who's fishing where (by inlet affiliation)
- What commercial traffic is present
- Who's had success (catch reports)
