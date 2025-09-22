/**************************************************************************************************
 ABFI — Robust Vessel Positions Stack (Schema + Safety + API Contracts + Client Rules + Ops)
 Single source of truth for fleet tracking robustness & performance. Idempotent where possible.
**************************************************************************************************/

-- ================================================================================================
-- 0) EXTENSIONS (safe if already enabled)
-- ================================================================================================
create extension if not exists pgcrypto;
create extension if not exists postgis;

-- ================================================================================================
-- 1) CORE TABLE: vessel_positions
--    High-write, query-by-inlet & latest-per-vessel. Keep flexible with meta JSON.
-- ================================================================================================
create table if not exists public.vessel_positions (
  id               uuid primary key default gen_random_uuid(),

  -- entity identity
  vessel_id        uuid      not null,    -- your fleet vessel identifier (profiles.id or a 'vessels' table)
  user_id          uuid,                  -- who submitted (owner) – optional, but used for RLS on writes
  inlet_id         text      not null,    -- e.g. 'md-ocean-city' (normalized slug)

  -- position
  lat              double precision not null,
  lon              double precision not null,
  geom             geometry(Point, 4326), -- auto-filled by trigger below

  -- kinematics
  speed_kn         double precision,
  heading_deg      double precision,

  -- provenance
  source           text not null check (source in ('user_gps','supabase_feed','gfw','mock')),
  recorded_at      timestamptz not null,            -- when position was taken (device/server time)
  inserted_at      timestamptz not null default now(), -- server ingest time

  -- misc
  accuracy_m       double precision,                 -- gps accuracy if available
  device_id        text,                             -- phone/browser ephemeral id if available
  meta             jsonb not null default '{}'::jsonb
);

comment on table public.vessel_positions is 'Raw vessel pings (30s cadence). Use views for latest & recent.';
comment on column public.vessel_positions.meta is 'Room for extras: battery, client_version, notes, etc.';

-- ================================================================================================
-- 2) TRIGGERS & SANITY
-- ================================================================================================
create or replace function public.vp_set_geom() returns trigger language plpgsql as $$
begin
  if NEW.lat is not null and NEW.lon is not null then
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326);
  end if;
  return NEW;
end $$;

drop trigger if exists trg_vp_set_geom on public.vessel_positions;
create trigger trg_vp_set_geom
before insert or update on public.vessel_positions
for each row execute function public.vp_set_geom();

-- Dedup guard: same vessel @ same timestamp should not create dup rows
create unique index if not exists ux_vp_vessel_time on public.vessel_positions (vessel_id, recorded_at);

-- Fast read patterns
create index if not exists idx_vp_inlet_time   on public.vessel_positions (inlet_id, recorded_at desc);
create index if not exists idx_vp_vessel_time2 on public.vessel_positions (vessel_id, recorded_at desc);
create index if not exists idx_vp_geom         on public.vessel_positions using gist (geom);

-- Optional sanity: clamp lat/lon to valid ranges
create or replace function public.vp_validate_latlon() returns trigger language plpgsql as $$
begin
  if NEW.lat is null or NEW.lon is null then
    raise exception 'lat/lon required';
  end if;
  if NEW.lat < -90 or NEW.lat > 90 or NEW.lon < -180 or NEW.lon > 180 then
    raise exception 'lat/lon out of range';
  end if;
  return NEW;
end $$;

drop trigger if exists trg_vp_validate_latlon on public.vessel_positions;
create trigger trg_vp_validate_latlon
before insert or update on public.vessel_positions
for each row execute function public.vp_validate_latlon();

-- ================================================================================================
-- 3) DERIVED VIEWS for fast map reads
-- ================================================================================================
-- Latest row per vessel (for dots)
create or replace view public.vessels_latest as
select distinct on (vessel_id)
  vessel_id, inlet_id, lat, lon, geom,
  speed_kn, heading_deg,
  source, recorded_at, inserted_at,
  accuracy_m, device_id, meta
from public.vessel_positions
order by vessel_id, recorded_at desc;

-- Recent rows for short trails on map (48h window, adjustable)
create or replace view public.vessel_positions_recent as
select *
from public.vessel_positions
where recorded_at > now() - interval '48 hours';

-- Health snapshot per inlet (counts + last ping)
create or replace view public.vessel_positions_health as
select inlet_id,
       count(*)                                            as rows_48h,
       count(distinct vessel_id)                           as vessels_48h,
       max(recorded_at)                                    as last_ping_at
from public.vessel_positions
where recorded_at > now() - interval '48 hours'
group by 1;

-- ================================================================================================
-- 4) UPSERT API (1 function to handle idempotent writes from clients/backends)
-- ================================================================================================
create or replace function public.vessel_positions_upsert(
  p_vessel_id   uuid,
  p_user_id     uuid,
  p_inlet_id    text,
  p_lat         double precision,
  p_lon         double precision,
  p_speed_kn    double precision,
  p_heading_deg double precision,
  p_source      text,
  p_recorded_at timestamptz,
  p_accuracy_m  double precision default null,
  p_device_id   text default null,
  p_meta        jsonb default '{}'::jsonb
) returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into public.vessel_positions
    (vessel_id, user_id, inlet_id, lat, lon, speed_kn, heading_deg, source, recorded_at, accuracy_m, device_id, meta)
  values
    (p_vessel_id, p_user_id, p_inlet_id, p_lat, p_lon, p_speed_kn, p_heading_deg, p_source, p_recorded_at, p_accuracy_m, p_device_id, p_meta)
  on conflict (vessel_id, recorded_at) do update
    set lat         = excluded.lat,
        lon         = excluded.lon,
        speed_kn    = excluded.speed_kn,
        heading_deg = excluded.heading_deg,
        inlet_id    = excluded.inlet_id,
        source      = excluded.source,
        accuracy_m  = excluded.accuracy_m,
        device_id   = coalesce(excluded.device_id, public.vessel_positions.device_id),
        meta        = coalesce(public.vessel_positions.meta, '{}'::jsonb) || coalesce(excluded.meta, '{}'::jsonb),
        inserted_at = now()
  returning id into v_id;

  return v_id;
end
$$;

-- ================================================================================================
-- 5) RLS (Row Level Security)
--    Read: allow all authenticated users (or open read if you want public map)
--    Write: only owner (user_id=auth.uid()) or service role can write.
-- ================================================================================================
alter table public.vessel_positions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='vessel_positions' and policyname='vessel_positions_read'
  ) then
    create policy vessel_positions_read
      on public.vessel_positions
      for select
      using (true);  -- change to (auth.uid() is not null) if you want auth-only reads
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='vessel_positions' and policyname='vessel_positions_write_own'
  ) then
    create policy vessel_positions_write_own
      on public.vessel_positions
      for insert
      with check (user_id = auth.uid() OR current_setting('request.jwt.claim.sub', true) is null);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='vessel_positions' and policyname='vessel_positions_update_own'
  ) then
    create policy vessel_positions_update_own
      on public.vessel_positions
      for update
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;

-- ================================================================================================
-- 6) RETENTION & MAINTENANCE (optional but recommended)
-- ================================================================================================
-- Call periodically to delete old raw pings; adjust window to your needs.
create or replace function public.vessel_positions_retention(p_days int default 14)
returns void language sql as $$
  delete from public.vessel_positions
  where recorded_at < now() - make_interval(days => p_days);
$$;

-- ================================================================================================
-- 7) CONSISTENCY CHECKS
-- ================================================================================================
-- Clamp future-dated positions to prevent client clock issues
create or replace function public.vp_clamp_future_time() returns trigger language plpgsql as $$
begin
  if NEW.recorded_at > now() + interval '5 minutes' then
    NEW.recorded_at := now();
  end if;
  return NEW;
end $$;

drop trigger if exists trg_vp_clamp_future_time on public.vessel_positions;
create trigger trg_vp_clamp_future_time
before insert or update on public.vessel_positions
for each row execute function public.vp_clamp_future_time();

-- ================================================================================================
-- 8) DOWN MIGRATION (for rollback if needed)
-- ================================================================================================
-- To rollback this migration, run:
-- drop table if exists public.vessel_positions cascade;
-- drop function if exists public.vessel_positions_upsert cascade;
-- drop function if exists public.vessel_positions_retention cascade;
-- drop function if exists public.vp_set_geom cascade;
-- drop function if exists public.vp_validate_latlon cascade;
-- drop function if exists public.vp_clamp_future_time cascade;
