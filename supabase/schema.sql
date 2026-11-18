-- ==============================================================================
-- KANNADI (കണ്ണാടി) — DATABASE SCHEMA & SECURITY POLICIES
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Go to the "SQL Editor" tab on the left sidebar
-- 3. Click "New Query", paste this entire script, and click "Run"
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- Profiles Table: Master user record for all opted-in participants
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  college_id text not null unique,
  photo_url text not null,
  gender text check (gender in ('male', 'female', 'other')),
  department text,
  elo_rating integer default 1200 not null,
  matches_played integer default 0 not null,
  wins integer default 0 not null,
  is_opted_in boolean default true not null,
  is_admin boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Fast lookup indexes
create index if not exists idx_profiles_active_elo on public.profiles (is_opted_in, elo_rating);
create index if not exists idx_profiles_college_id on public.profiles (college_id);

-- Votes Table: Audit trail of every head-to-head vote cast
create table if not exists public.votes (
  id bigint generated always as identity primary key,
  voter_id uuid references public.profiles(id) on delete set null,
  winner_id uuid references public.profiles(id) on delete cascade not null,
  loser_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_votes_voter_created on public.votes (voter_id, created_at desc);
create index if not exists idx_votes_winner on public.votes (winner_id);
create index if not exists idx_votes_loser on public.votes (loser_id);

-- Admin Logs Table: Immutable log of administrative moderation actions
create table if not exists public.admin_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null, -- 'DELETE_PROFILE', 'ADJUST_ELO', 'TOGGLE_VISIBILITY'
  target_user_id uuid,
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_admin_logs_created on public.admin_logs (created_at desc);

-- 3. HELPER FUNCTIONS

-- Helper to safely verify admin role without exposing elevation vectors
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- 4. ROW-LEVEL SECURITY (RLS) POLICIES

alter table public.profiles enable row level security;
alter table public.votes enable row level security;
alter table public.admin_logs enable row level security;

-- PROFILES POLICIES
-- Drop existing policies if re-running
drop policy if exists "Allow read for active profiles" on public.profiles;
drop policy if exists "Allow individual profile update" on public.profiles;
drop policy if exists "Allow individual insert" on public.profiles;
drop policy if exists "Allow admin delete" on public.profiles;

-- Anyone authenticated can view active opted-in participants (or admins can view all)
create policy "Allow read for active profiles"
  on public.profiles for select
  to authenticated
  using (is_opted_in = true or auth.uid() = id or public.is_admin());

-- Users can update their display name or photo, but CANNOT elevate is_admin, reset elo, or set is_opted_in = false
create policy "Allow individual profile update"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (
    public.is_admin() or (
      auth.uid() = id
      and is_opted_in = true
      and is_admin = false
    )
  );

-- Users can insert their initial profile upon agreeing to the terms (cannot self-grant admin)
create policy "Allow individual insert"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id and is_opted_in = true and is_admin = false);

-- Only admins can delete profiles (enforces irrevocable participation for regular users)
create policy "Allow admin delete"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- VOTES POLICIES
drop policy if exists "Allow insert vote" on public.votes;
drop policy if exists "Allow select votes" on public.votes;

-- Users can insert votes where voter_id is themselves
create policy "Allow insert vote"
  on public.votes for insert
  to authenticated
  with check (auth.uid() = voter_id);

-- Admins and regular users can ONLY view their own vote history (admin cannot see individual votes)
create policy "Allow select votes"
  on public.votes for select
  to authenticated
  using (auth.uid() = voter_id);

-- APP SETTINGS TABLE & POLICIES
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.app_settings enable row level security;
drop policy if exists "Allow read app_settings" on public.app_settings;
drop policy if exists "Allow admin write app_settings" on public.app_settings;

create policy "Allow read app_settings"
  on public.app_settings for select
  to authenticated
  using (true);

create policy "Allow admin write app_settings"
  on public.app_settings for all
  to authenticated
  using (public.is_admin());

-- Default Settings
insert into public.app_settings (key, value)
values
  ('leaderboard_top_count', '20'::jsonb),
  ('rounds_per_session', '15'::jsonb)
on conflict (key) do nothing;

-- ADMIN LOGS POLICIES
drop policy if exists "Allow admin logs access" on public.admin_logs;

create policy "Allow admin logs access"
  on public.admin_logs for all
  to authenticated
  using (public.is_admin());

-- 5. STORED PROCEDURES (RPC)

-- Atomic Elo Matchup Vote Transaction
create or replace function public.submit_matchup_vote(
  p_winner_id uuid,
  p_loser_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_voter_id uuid := auth.uid();
  v_winner_rating int;
  v_loser_rating int;
  v_winner_matches int;
  v_loser_matches int;
  v_k_winner int;
  v_k_loser int;
  v_expected_winner float;
  v_expected_loser float;
  v_new_winner_rating int;
  v_new_loser_rating int;
begin
  -- Disallow invalid or self-votes
  if p_winner_id = p_loser_id or p_winner_id = v_voter_id or p_loser_id = v_voter_id then
    raise exception 'Invalid matchup parameters';
  end if;

  -- Deadlock-safe row locking: lock in consistent ascending order
  if p_winner_id < p_loser_id then
    select elo_rating, matches_played into v_winner_rating, v_winner_matches from public.profiles where id = p_winner_id for update;
    select elo_rating, matches_played into v_loser_rating, v_loser_matches from public.profiles where id = p_loser_id for update;
  else
    select elo_rating, matches_played into v_loser_rating, v_loser_matches from public.profiles where id = p_loser_id for update;
    select elo_rating, matches_played into v_winner_rating, v_winner_matches from public.profiles where id = p_winner_id for update;
  end if;

  if v_winner_rating is null or v_loser_rating is null then
    raise exception 'One or both profiles do not exist';
  end if;

  -- Dynamic K-Factor: K=32 for provisional (<20 matches), K=16 for established
  v_k_winner := case when v_winner_matches < 20 then 32 else 16 end;
  v_k_loser  := case when v_loser_matches  < 20 then 32 else 16 end;

  -- Expected Score calculations
  v_expected_winner := 1.0 / (1.0 + power(10.0, (v_loser_rating - v_winner_rating)::float / 400.0));
  v_expected_loser  := 1.0 / (1.0 + power(10.0, (v_winner_rating - v_loser_rating)::float / 400.0));

  -- New Elo Ratings
  v_new_winner_rating := round(v_winner_rating + v_k_winner * (1.0 - v_expected_winner));
  v_new_loser_rating  := round(v_loser_rating  + v_k_loser  * (0.0 - v_expected_loser));

  -- Update Winner
  update public.profiles
  set elo_rating = v_new_winner_rating,
      matches_played = matches_played + 1,
      wins = wins + 1,
      updated_at = timezone('utc'::text, now())
  where id = p_winner_id;

  -- Update Loser
  update public.profiles
  set elo_rating = v_new_loser_rating,
      matches_played = matches_played + 1,
      updated_at = timezone('utc'::text, now())
  where id = p_loser_id;

  -- Insert Vote Log
  insert into public.votes (voter_id, winner_id, loser_id)
  values (v_voter_id, p_winner_id, p_loser_id);
end;
$$;

-- Matchmaking procedure: selects the next challenger with cold-start boost
create or replace function public.get_next_challenger(
  p_king_id uuid,
  p_excluded_ids uuid[]
)
returns setof public.profiles
language sql
stable
security definer
as $$
  select *
  from public.profiles
  where is_opted_in = true
    and id != coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    and id != p_king_id
    and id != all(coalesce(p_excluded_ids, array[]::uuid[]))
  order by
    -- Cold start prioritization (< 10 matches)
    (matches_played < 10) desc,
    random()
  limit 1;
$$;

-- Admin Procedure: Emergency profile purge with audit logging
create or replace function public.admin_delete_profile(
  p_target_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Admin privileges required';
  end if;

  insert into public.admin_logs (admin_id, action, target_user_id, details)
  values (auth.uid(), 'DELETE_PROFILE', p_target_id, jsonb_build_object('reason', p_reason));

  delete from public.profiles where id = p_target_id;
end;
$$;

-- Note: admin_adjust_elo has been intentionally removed; scores cannot be modified by admins.

-- 6. STORAGE BUCKET POLICIES (for 'avatars' bucket)
-- Ensure the 'avatars' bucket exists and is public
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Drop existing storage policies if re-running
drop policy if exists "Public avatar access" on storage.objects;
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Users and admins can update avatars" on storage.objects;
drop policy if exists "Admins can delete avatars" on storage.objects;

-- Allow public read access to avatars
create policy "Public avatar access"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Allow authenticated users to upload their avatar
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

-- Allow owners and admins to update avatar objects
create policy "Users and admins can update avatars"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (owner = auth.uid() or public.is_admin()));

-- Only admins can delete avatar objects
create policy "Admins can delete avatars"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and public.is_admin());
