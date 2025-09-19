# Community Page - Flow & UI Design

## Overview
The Community page is where anglers share reports, insights, and connect with other fishermen. It's the social hub of ABFI.

## Current Implementation Location
- **Route**: `/legendary/community`
- **Main Component**: `src/app/legendary/community/page.tsx`
- **Key Components**: 
  - `ReportsFeed.tsx` - Displays community reports
  - `ReportsPanel.tsx` - Report management UI

## UI Layout & Design

### 1. Header Section
- **Title**: "Community Reports" 
- **Subtitle**: "Share your catches and learn from others"
- **Filters/Tabs**: 
  - All Reports
  - My Reports
  - Saved/Bookmarked
  - Trending/Hot

### 2. Report Creation
- **"Share Your Catch" Button** - Prominent CTA
- **Quick Report Options**:
  - Photo upload
  - Location (auto-filled from GPS)
  - Species caught
  - Conditions (SST, weather, time)
  - Notes/tips

### 3. Reports Feed
- **Report Cards** showing:
  - Captain name & avatar
  - Timestamp ("2 hours ago")
  - Location (inlet or coordinates)
  - Photo thumbnail
  - Species & size
  - Ocean conditions at time
  - Likes/comments count
  - "Useful" reactions

### 4. Report Types
1. **Full Analysis Reports** - From Snip Tool
   - Comprehensive ocean analysis
   - Multiple data layers
   - Vessel tracks
   - Professional insights

2. **Quick Bite Reports** - From ABFI button
   - Simple location/time/species
   - Auto-captured conditions
   - Quick photo

3. **Manual Reports** - User created
   - Custom entries
   - Multiple photos
   - Detailed notes

### 5. Interactions
- **Like/React** - ❤️ 🎣 🔥 👍
- **Comment** - Tips, questions, congrats
- **Save** - Bookmark for later
- **Share** - External sharing
- **Follow** - Follow successful captains

### 6. Privacy Controls
- **Report Visibility**:
  - Public (all users)
  - Friends only
  - Private (just me)
- **Location Fuzzing** - Option to hide exact spot
- **Anonymous Mode** - Share without name

### 7. Search & Filter
- **By Species**: Striped Bass, Bluefish, etc.
- **By Location**: Specific inlets
- **By Date**: Today, This Week, This Month
- **By Conditions**: Temperature ranges, weather
- **By Captain**: Follow specific users

### 8. Gamification Elements
- **Captain Levels**: Based on contributions
- **Badges**: 
  - "Early Bird" (dawn catches)
  - "Storm Chaser" (rough conditions)
  - "Species Master" (variety)
  - "Helper" (useful tips)
- **Leaderboards**: Weekly/Monthly top contributors

## User Flow

### Creating a Report
1. Click "Share Your Catch"
2. Choose report type (Quick/Full)
3. Add photo (required)
4. Confirm/edit location
5. Select species & size
6. Add notes (optional)
7. Set privacy level
8. Post to community

### Viewing Reports
1. Browse feed (infinite scroll)
2. Click report card to expand
3. View full details & photos
4. See ocean conditions
5. Read/add comments
6. Save or share

### From Snip Tool → Community
1. Complete ocean analysis
2. Click "Share to Community"
3. Report auto-populated with:
   - Analysis summary
   - Ocean conditions
   - Location polygon
   - Insights
4. Add personal notes
5. Post with enhanced data

## Brand Alignment
- **Colors**: Cyan/blue gradient theme
- **Typography**: Clean, maritime feel
- **Icons**: Lucide icons, nautical themes
- **Animations**: Smooth, water-like transitions
- **Tone**: Professional but friendly, data-driven

## Technical Considerations
- **Real-time Updates**: New reports appear live
- **Offline Support**: Queue posts when offline
- **Image Optimization**: Compress uploads
- **Data Privacy**: Respect location preferences
- **Performance**: Lazy load images, virtualize long lists

## Future Enhancements
- **Groups/Clubs**: Private fishing groups
- **Events**: Tournament integration
- **Marketplace**: Buy/sell/trade
- **Guides**: Book fishing charters
- **Education**: How-to content from pros
