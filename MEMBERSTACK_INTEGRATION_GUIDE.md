# Memberstack Integration Implementation Guide

## Overview
This guide shows how to integrate Memberstack authentication into the Always Bent app.

## What's Been Created

### 1. Core Components

#### `/src/lib/memberstack/MemberstackProvider.tsx`
- Main Memberstack integration wrapper
- Handles authentication state
- Syncs with localStorage for backward compatibility
- Provides hooks for login, signup, logout

#### `/src/lib/supabase/AuthProvider.memberstack.tsx`
- Updated AuthProvider that uses Memberstack
- Syncs member data with Supabase profiles
- Handles legacy user migration

#### `/src/components/auth/ProtectedRoute.tsx`
- Route protection wrapper
- Ensures users are authenticated
- Checks for complete profiles

#### `/src/app/auth/page.tsx`
- New landing/auth page
- Handles login/signup flow
- Beautiful ocean-themed design

## Setup Steps

### 1. Environment Variable
Add to your `.env.local` and Vercel:
```
NEXT_PUBLIC_MEMBERSTACK_APP_ID=your_memberstack_app_id
```

### 2. Update Root Providers
Replace the contents of `/src/app/providers.tsx` with `/src/app/providers.memberstack.tsx`:
```bash
cp src/app/providers.memberstack.tsx src/app/providers.tsx
```

### 3. Update AuthProvider
Replace the auth provider:
```bash
cp src/lib/supabase/AuthProvider.memberstack.tsx src/lib/supabase/AuthProvider.tsx
```

### 4. Protect Routes
Wrap protected pages with ProtectedRoute:
```tsx
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function AnalysisPage() {
  return (
    <ProtectedRoute>
      {/* Your page content */}
    </ProtectedRoute>
  );
}
```

### 5. Update Welcome Flow
The welcome page (`/legendary/welcome`) now:
- Checks for Memberstack member
- Collects captain/boat name if missing
- Updates member custom fields

## Memberstack Dashboard Setup

### 1. Create Custom Fields
In Memberstack dashboard → Settings → Custom Fields:
- `captainName` (text, required)
- `boatName` (text, required)  
- `homePort` (text, optional)

### 2. Configure Plans
Create a plan:
- Name: "Beta Access"
- Price: $0 (or your price)
- ID: `plan_beta`

### 3. Configure Redirects
- After signup: `/legendary/welcome`
- After login: `/legendary`

### 4. Style Modals (Optional)
Add to Memberstack → Settings → Custom CSS:
```css
.ms-modal {
  background: #0f172a !important;
  border: 1px solid #06b6d4 !important;
}

.ms-modal input {
  background: #1e293b !important;
  border: 1px solid #334155 !important;
  color: #f1f5f9 !important;
}

.ms-modal button[type="submit"] {
  background: #06b6d4 !important;
  color: #0f172a !important;
}
```

## Migration Path

### For New Users:
1. Land on `/auth` page
2. Click "Launch App" → Signup modal
3. Create account → Redirect to `/legendary/welcome`
4. Complete profile → Enter app

### For Existing localStorage Users:
1. App detects legacy auth
2. Prompts to create Memberstack account
3. Pre-fills their existing captain/boat info
4. Migrates to Memberstack auth

## Testing Checklist

- [ ] Environment variable set
- [ ] Memberstack script loads
- [ ] Signup flow works
- [ ] Login flow works
- [ ] Profile data saves to custom fields
- [ ] Supabase profile syncs
- [ ] Protected routes redirect properly
- [ ] Legacy users can migrate

## Production Deployment

1. Set `NEXT_PUBLIC_MEMBERSTACK_APP_ID` in Vercel
2. Add all other required environment variables
3. Deploy to production
4. Update domain settings in Memberstack
5. Test full flow on production URL

## Rollback Plan

If issues arise, simply:
1. Remove `NEXT_PUBLIC_MEMBERSTACK_APP_ID` from env
2. App automatically falls back to localStorage auth
3. No data is lost

## Next Steps After Integration

1. **Domain Setup**: Configure app.alwaysbent.com
2. **Payment Integration**: Add paid plans in Memberstack
3. **Email Automation**: Set up welcome emails
4. **Analytics**: Track conversion rates
5. **Support**: Set up help documentation
