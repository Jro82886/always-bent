# 🚨 URGENT: Supabase Migration - Final Steps for Milestone 1

## Option 1: Direct Supabase Dashboard Access (FASTEST)

1. **Login to Supabase:**
   - URL: https://app.supabase.com
   - Email: jeff@alwaysbent.com
   - Password: porzyp-sofga8-tiCryb

2. **Select the Project:**
   - Choose: **MVP 9/11** (NOT the other project)

3. **Go to SQL Editor:**
   - Click "SQL Editor" in the left sidebar

4. **Run the Migration:**
   - Click "New query" button
   - Copy/paste ENTIRE contents of: `FINAL_WORKING_MIGRATION.sql`
   - Click "RUN" button (bottom right)

5. **Verify Success:**
   - You should see: "Tables Created Successfully!"
   - demo_users: 1
   - saved_analyses: 1

---

## Option 2: If You Have Access (As Invited User)

Since they've invited you to the project:

1. **Accept Invitation:**
   - Check your email for Supabase invitation
   - Or go to: https://app.supabase.com/projects
   - You should see "MVP 9/11" project

2. **Direct Link to SQL Editor:**
   ```
   https://app.supabase.com/project/hobvjmmambhonsugehge/sql/new
   ```

3. **Run the Migration:**
   - Paste contents of `FINAL_WORKING_MIGRATION.sql`
   - Click RUN

---

## Option 3: Using Supabase CLI (If Linked)

```bash
# Link to the project first
supabase link --project-ref hobvjmmambhonsugehge

# Then run migration
supabase db push FINAL_WORKING_MIGRATION.sql
```

---

## What This Migration Does:

1. ✅ Adds missing columns to existing `profiles` table
2. ✅ Creates `snips` table for saved analyses
3. ✅ Inserts demo user account
4. ✅ Adds sample analysis data
5. ✅ Disables RLS for testing

---

## After Migration - Test The App:

1. **Open:** http://localhost:3003/legendary/analysis?inlet=md-ocean-city
2. **Click:** "Demo Login (Milestone 1)" button
3. **Draw:** Rectangle on ocean
4. **Click:** "Analyze"
5. **Click:** "Save to My Reports"
6. **Success:** Should see "Saved to My Snipped Reports"

---

## If Migration Fails:

The error "column email does not exist" means the profiles table exists but is missing columns. Our migration handles this by using `ADD COLUMN IF NOT EXISTS`.

If you still get errors, run these commands one at a time:

```sql
-- First, just add the email column
ALTER TABLE public.profiles ADD COLUMN email TEXT;

-- Then run the rest of the migration
```

---

## Project Details:

- **Project ID:** hobvjmmambhonsugehge
- **Region:** us-west-1
- **Database URL:** postgresql://postgres.hobvjmmambhonsugehge:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres

---

## 🎯 SUCCESS CRITERIA:

After running the migration, you should be able to:
1. Save analyses from the snipping tool
2. Demo user login works
3. No database errors in console

This completes Milestone 1's database requirements!