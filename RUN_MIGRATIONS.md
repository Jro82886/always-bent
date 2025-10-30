# Database Migration Instructions

## To fix the snips save error, you need to run the database migrations:

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Login**: jeff@alwaysbent.com / porzyp-sofga8-tiCryb
3. **Select the project**: MVP 9/11
4. **Go to SQL Editor**
5. **Run this migration**:

```sql
-- SNIPS (saved extended analyses)
create table if not exists public.snips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  inlet_slug text not null,
  date date not null,
  area_nm2 numeric,
  species text[],

  sst_mean_f numeric,
  sst_p10_f numeric,
  sst_p90_f numeric,
  sst_grad_f numeric,

  chl_mean numeric,
  chl_p10 numeric,
  chl_p90 numeric,
  chl_grad numeric,

  narrative jsonb,               -- { sstText, chlText, synth }
  created_at timestamptz not null default now()
);

create index if not exists snips_user_date_idx on public.snips (user_id, date desc);

-- Enable RLS
alter table public.snips enable row level security;

-- Policies
create policy "Users can read their own snips" on public.snips
  for select using (auth.uid() = user_id);

create policy "Users can insert their own snips" on public.snips
  for insert with check (auth.uid() = user_id);
```

## Alternative: Disable RLS temporarily for testing

If you want to test saving without authentication first:

```sql
-- Disable RLS on snips table (for testing only)
alter table public.snips disable row level security;
```

## Note about Authentication

The save error is happening because:
1. The API is using a hardcoded placeholder user ID
2. The database has Row Level Security (RLS) enabled
3. The RLS policies require a valid authenticated user

Once Memberstack authentication is fully integrated, this will work properly.