# Authentication Audit Report - Always Bent Fishing Intelligence

## 1. SUPABASE USAGE INVENTORY

### **Supabase Features Currently Used:**

#### **A. Authentication (AUTH)**
- User signup/login/logout
- Session management
- Password authentication
- Auth state subscriptions

#### **B. Database (POSTGRES)**
- **Core Tables:**
  - `profiles` - User profiles with captain/boat names
  - `bite_reports` - Fishing bite reports
  - `catch_reports` - Catch documentation
  - `vessel_tracks` - Vessel GPS tracking
  - `vessel_positions` - Real-time vessel positions
  - `loitering_events` - Fishing activity detection
  - `hotspot_intelligence` - Community hotspot data
  - `snip_analyses` - ML analysis results
  - `ml_patterns` - Machine learning patterns
  - `tracking_positions` - Position history
  - `dm_conversations` - Direct messages
  - `dm_messages` - Message content
  - `dm_unread_counts` - Unread message counts

#### **C. Realtime Features**
- **Chat System** (`/lib/services/chat.ts`)
  - Broadcast-only channels for inlet chat
  - No database persistence (broadcast only)
- **Community Feed** (`/components/community/ReportsFeed.tsx`)
  - Subscribes to bite_reports changes
- **DM System** (`/lib/services/dm.ts`)
  - Real-time direct messaging
- **Bite Notifications** (`/lib/notifications/biteNotifications.ts`)
  - Real-time bite alerts

#### **D. Storage**
- Not currently used

---

## 2. AUTHENTICATION CODE LOCATIONS

### **Core Auth Files:**
```
src/lib/supabase/
├── AuthProvider.tsx     # Main auth context provider
├── client.ts           # Browser Supabase client
├── server.ts           # Server-side Supabase client
└── session.ts          # Session management utilities

src/components/
└── AuthGuard.tsx       # Route protection component

src/app/auth/
├── login/page.tsx      # Login page
└── register/page.tsx   # Registration page

src/app/api/auth/
└── squarespace/route.ts # Squarespace SSO integration

src/middleware.ts       # Rate limiting only (NO AUTH)
```

### **Files Using Auth Methods:**
- **Login/Signup:** 
  - `/app/auth/login/page.tsx`
  - `/app/auth/register/page.tsx`
  - `/app/welcome/page.tsx`
  - `/app/start/page.tsx`

- **Auth Checks:**
  - `/api/community/fleet/route.ts`
  - `/api/community/hotspots/route.ts`
  - `/api/community/reports/route.ts`
  - `/api/bites/batch/route.ts`
  - `/components/tracking/VesselLayer.tsx`
  - `/components/community/ReportsFeed.tsx`

- **Session Management:**
  - `/lib/supabase/AuthProvider.tsx`
  - `/lib/offline/biteSync.ts`

---

## 3. COMPONENTS TO PRESERVE

### **CRITICAL - Must Keep Working:**

#### **Database Connections (Non-Auth)**
```typescript
// All these work WITHOUT authentication:
- /api/tiles/* routes (SST/CHL data)
- /api/weather/* routes
- /api/ocean-features/* routes
- /api/polygons/* routes
- /api/analyze/* routes (ML analysis)
```

#### **Realtime Features to Preserve:**
1. **Chat System** (`/lib/services/chat.ts`)
   - Uses broadcast-only (no auth required)
   - Can work with anonymous users

2. **Community Features** (Need modification)
   - Currently require user ID
   - Can be modified to work anonymously

#### **Local Storage Data:**
```javascript
// These are used for app functionality:
- abfi_captain_name
- abfi_boat_name
- abfi_user_id (can be generated locally)
- abfi_session_start
- abfi_selected_inlet
- abfi_home_port
```

---

## 4. SAFE REMOVAL PLAN

### **Phase 1: Remove Auth Pages (SAFE)**
```bash
# Can delete entirely:
src/app/auth/login/page.tsx
src/app/auth/register/page.tsx
src/app/api/auth/squarespace/route.ts
```

### **Phase 2: Simplify Auth Provider**
```typescript
// Convert AuthProvider.tsx to a simple stub:
export function AuthProvider({ children }) {
  return <>{children}</>;
}
```

### **Phase 3: Modify AuthGuard**
```typescript
// Make AuthGuard always pass through:
export default function AuthGuard({ children }) {
  return <>{children}</>;
}
```

### **Phase 4: Update API Routes**
Remove auth checks from:
- `/api/community/fleet/route.ts` (lines 13, 107)
- `/api/community/hotspots/route.ts` (line 88)
- `/api/community/reports/route.ts` (line 80)
- `/api/bites/batch/route.ts` (line 15)

Replace with mock user:
```typescript
const user = { id: 'demo-user', email: 'demo@abfi.com' };
```

### **Phase 5: Fix Welcome Flow**
```typescript
// In /app/legendary/welcome/page.tsx
// Remove lines 27-43 (auth check)
// Use localStorage for profile:
const userId = localStorage.getItem('abfi_user_id') || 
               `local-${Date.now()}`;
```

---

## 5. POTENTIAL BREAKING POINTS

### **HIGH RISK - Needs Careful Handling:**

1. **Profile Creation** (`/legendary/welcome/page.tsx`)
   - Currently tries to save to Supabase
   - **FIX:** Save only to localStorage

2. **Community Features**
   - Bite reports need user_id
   - **FIX:** Use generated local ID

3. **Vessel Tracking**
   - Uses user_id for ownership
   - **FIX:** Use boat_name as identifier

### **MEDIUM RISK:**

1. **Chat System**
   - Already works without auth (broadcast only)
   - No changes needed

2. **DM System**
   - Requires user authentication
   - **FIX:** Disable or use mock users

### **LOW RISK:**

1. **Map Features** - No auth dependency
2. **Weather API** - No auth dependency  
3. **Ocean Data** - No auth dependency
4. **Analysis Tools** - No auth dependency

---

## 6. RECOMMENDED APPROACH

### **Option A: Quick Fix (Keep Supabase, Remove Auth)**
1. Bypass auth checks in API routes
2. Use localStorage for user data
3. Generate local user IDs
4. Keep all database features working

### **Option B: Full Removal (Remove All Supabase)**
1. Remove all Supabase dependencies
2. Use localStorage for all data
3. Disable community features
4. Focus on core map/analysis tools

### **Option C: Hybrid (Recommended)**
1. Keep Supabase for database/realtime
2. Remove only authentication
3. Use anonymous users
4. Preserve all functionality

---

## 7. IMPLEMENTATION CHECKLIST

```markdown
[ ] Backup current code
[ ] Create local user ID generator
[ ] Update AuthProvider to stub
[ ] Update AuthGuard to pass-through
[ ] Remove auth checks from API routes
[ ] Fix welcome flow to use localStorage
[ ] Test all features still work
[ ] Remove unused auth pages
[ ] Clean up package.json dependencies
```

---

## 8. FILES SAFE TO DELETE

```
✅ SAFE TO DELETE:
- src/app/auth/login/page.tsx
- src/app/auth/register/page.tsx  
- src/app/auth/callback/
- src/app/auth/confirm/
- src/app/auth/magic/
- src/app/auth/signup/
- src/app/auth/squarespace/
- src/app/api/auth/squarespace/route.ts

⚠️ MODIFY, DON'T DELETE:
- src/lib/supabase/AuthProvider.tsx
- src/components/AuthGuard.tsx
- src/lib/supabase/client.ts

❌ DO NOT TOUCH:
- src/lib/supabase/profiles.ts (has non-auth functions)
- src/lib/services/chat.ts (realtime features)
- Any API routes (just remove auth checks)
```

---

## SUMMARY

Your app uses Supabase for:
1. **Authentication** (25% - REMOVABLE)
2. **Database** (50% - KEEP)
3. **Realtime** (25% - KEEP)

**Safest approach:** Remove auth checks but keep Supabase client for database/realtime features. Use localStorage for user identification.

**Time estimate:** 1-2 hours to safely remove auth while preserving all other functionality.
