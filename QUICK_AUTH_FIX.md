# Quick Fix to Bypass Auth Error

## Option 1: Direct Database Fix (FASTEST)

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" 
3. Run this SQL:

```sql
-- Create Amanda's profile directly
INSERT INTO profiles (id, email, captain_name, boat_name, home_port, created_at, updated_at)
SELECT 
  id,
  email,
  'Amanda',
  'Reel Amanda', 
  'Ocean City',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'hiamandak@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
  captain_name = 'Amanda',
  boat_name = 'Reel Amanda',
  home_port = 'Ocean City',
  updated_at = NOW();
```

## Option 2: Temporary Code Bypass

Add this to `/src/app/legendary/welcome/page.tsx` line 94 (replace the error handling):

```typescript
} catch (error: any) {
  console.error('Profile error:', error);
  // TEMPORARY: Skip profile save error
  localStorage.setItem('abfi_captain_name', captainName.trim());
  localStorage.setItem('abfi_boat_name', boatName.trim());
  localStorage.setItem('abfi_user_id', userId);
  setStep(2);  // Move to next step anyway
  setLoading(false);
}
```

## Option 3: Use Direct URL

Skip the welcome flow entirely:
1. Go directly to: https://always-bent.vercel.app/legendary
2. The app will use default values

After any of these fixes, you can test the chlorophyll layer!
