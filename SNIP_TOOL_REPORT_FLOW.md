# Snip Tool Report Flow

## Current State
The Snip Tool generates comprehensive ocean analysis including:
- SST/CHL data analysis
- Vessel tracking information
- Hotspot identification
- Weather and marine conditions
- Fishing recommendations

## Report Functionality (To Implement)

### 1. Save Report
When user clicks "Save" in the analysis modal:
- Save to user's personal reports collection
- Include all analysis data, timestamp, location
- Store polygon bounds for future reference
- Allow user to add notes/tags

### 2. Share to Community
From saved reports, users can:
- Share successful fishing reports to community
- Include catch photos and species
- Redact sensitive hotspot locations (optional)
- Add tips and techniques used

### 3. Report Management
- View personal report history
- Filter by date, location, success rate
- Export reports as PDF/image
- Delete old reports

### 4. Community Integration
- Reports appear in Community tab
- Other users can view shared reports
- Upvote/downvote system
- Comments and discussions

## Technical Implementation Notes

### Database Schema
```sql
-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  analysis_data JSONB,
  polygon_bounds GEOMETRY,
  created_at TIMESTAMP,
  notes TEXT,
  tags TEXT[],
  is_shared BOOLEAN DEFAULT false,
  share_settings JSONB
);

-- Community shares
CREATE TABLE community_reports (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reports(id),
  shared_at TIMESTAMP,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0
);
```

### UI Flow
1. Analysis complete → Show Save button
2. Save → Store to personal reports
3. View report → Option to share
4. Share → Configure privacy settings
5. Submit → Appears in community feed

### Privacy Considerations
- Allow hotspot coordinate fuzzing
- Hide exact vessel track details
- Optional anonymous sharing
- Time delay options (share after 24h)
