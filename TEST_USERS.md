# 🎣 TEST USER ACCOUNTS

## How to Create Test Users

Since we need your Supabase credentials to create users programmatically, here are 3 test accounts you can create manually:

### Option 1: Use the Registration Page (Recommended)
Go to your deployed site at `/auth/register` and create these accounts:

---

## 📝 Test User Credentials

### 🚢 Test User 1 - Captain Jack
- **Email:** `captain.jack@test.com`
- **Password:** `FishOn2024!`
- **Captain Name:** Captain Jack
- **Boat:** Sea Hunter
- **Home Port:** Ocean City

### 🚢 Test User 2 - Captain Sarah  
- **Email:** `captain.sarah@test.com`
- **Password:** `ReelTime2024!`
- **Captain Name:** Captain Sarah
- **Boat:** Blue Marlin
- **Home Port:** Montauk

### 🚢 Test User 3 - Captain Mike
- **Email:** `captain.mike@test.com`
- **Password:** `TightLines2024!`
- **Captain Name:** Captain Mike
- **Boat:** Offshore Dream
- **Home Port:** Cape May

---

## 🔧 Manual Setup Instructions

### Using the App (Easiest):
1. Go to `/auth/register` on your deployed site
2. Create each account using the credentials above
3. Check email for verification (or skip if testing locally)
4. Login at `/auth/login` with the credentials

### Using Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to Authentication → Users
3. Click "Add user" → "Create new user"
4. Enter the email and password from above
5. Check "Auto Confirm Email" for testing
6. Click "Create user"

---

## 🧪 Testing Scenarios

### Test Login Flow:
1. Go to `/auth/login`
2. Enter email: `captain.jack@test.com`
3. Enter password: `FishOn2024!`
4. Click "Sign In"
5. Should redirect to `/legendary/welcome`

### Test Wrong Password:
1. Use correct email but wrong password
2. Should see error: "Invalid login credentials"

### Test Registration:
1. Go to `/auth/register`
2. Create a new account with strong password
3. Verify email validation works
4. Confirm password requirements are enforced

### Test Remember Me:
1. Login with "Remember me" checked
2. Close browser
3. Reopen - should stay logged in

---

## ⚠️ Important Notes

- These are TEST accounts only
- Delete before production launch
- Passwords meet all security requirements:
  - 8+ characters ✓
  - Uppercase letter ✓
  - Lowercase letter ✓
  - Number ✓
  - Special character ✓

---

## 🗑️ Cleanup Before Production

To remove test users from Supabase:
1. Go to Supabase Dashboard → Authentication → Users
2. Select test users
3. Click "Delete users"

Or use SQL in Supabase SQL Editor:
```sql
-- Delete test users
DELETE FROM auth.users 
WHERE email IN (
  'captain.jack@test.com',
  'captain.sarah@test.com',
  'captain.mike@test.com'
);
```
