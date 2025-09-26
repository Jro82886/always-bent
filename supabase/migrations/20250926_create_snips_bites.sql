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

-- BITES (user bite reports)
create table if not exists public.bites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  inlet_slug text not null,
  species text[],
  count int,
  method text,
  note text,
  lat numeric,
  lng numeric,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists bites_user_time_idx on public.bites (user_id, occurred_at desc);

-- Enable RLS
alter table public.bites enable row level security;

-- Policies
create policy "Users can read their own bites" on public.bites
  for select using (auth.uid() = user_id);

create policy "Users can insert their own bites" on public.bites
  for insert with check (auth.uid() = user_id);
