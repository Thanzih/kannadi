-- ==============================================================================
-- KANNADI (കണ്ണാടി) — 10 DEMO PROFILES SEED SCRIPT
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/abnztzqwjzexqsfvszhb
-- 2. Go to "SQL Editor" > "New Query"
-- 3. Paste this script and click "Run"
-- ==============================================================================

do $$
declare
  demo_users record;
  new_uid uuid;
begin
  -- Temporary table of realistic demo college students
  create temp table if not exists tmp_demo_profiles (
    name text,
    college_id text,
    photo_url text,
    gender text,
    department text,
    elo_rating int,
    matches_played int,
    wins int,
    email text
  ) on commit drop;

  -- 10 High-Quality Student Profiles
  insert into tmp_demo_profiles (name, college_id, photo_url, gender, department, elo_rating, matches_played, wins, email)
  values
  (
    'Aarav Sharma',
    'MEC22CS012',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
    'male',
    'Computer Science',
    1240, 14, 9,
    'aarav.demo@kannadi.app'
  ),
  (
    'Diya Menon',
    'MEC22CS045',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    'female',
    'Computer Science',
    1285, 18, 13,
    'diya.demo@kannadi.app'
  ),
  (
    'Rohan Varma',
    'MEC22EC018',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    'male',
    'Electronics & Comm.',
    1210, 11, 6,
    'rohan.demo@kannadi.app'
  ),
  (
    'Ananya Patel',
    'MEC22EC033',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    'female',
    'Electronics & Comm.',
    1260, 15, 10,
    'ananya.demo@kannadi.app'
  ),
  (
    'Siddharth Pillai',
    'MEC22ME009',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    'male',
    'Mechanical Engg.',
    1190, 9, 4,
    'siddharth.demo@kannadi.app'
  ),
  (
    'Meera Nambiar',
    'MEC22ME041',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    'female',
    'Mechanical Engg.',
    1230, 12, 7,
    'meera.demo@kannadi.app'
  ),
  (
    'Kevin Mathew',
    'MEC22EE021',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80',
    'male',
    'Electrical Engg.',
    1225, 10, 6,
    'kevin.demo@kannadi.app'
  ),
  (
    'Riya Sen',
    'MEC22EE055',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    'female',
    'Electrical Engg.',
    1270, 16, 11,
    'riya.demo@kannadi.app'
  ),
  (
    'Farhan Ali',
    'MEC22CE015',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
    'male',
    'Civil Engg.',
    1180, 8, 3,
    'farhan.demo@kannadi.app'
  ),
  (
    'Sneha Kulkarni',
    'MEC22CE038',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    'female',
    'Civil Engg.',
    1250, 13, 8,
    'sneha.demo@kannadi.app'
  );

  -- Loop and safely insert into auth.users + public.profiles
  for demo_users in select * from tmp_demo_profiles loop
    if not exists (select 1 from public.profiles where college_id = demo_users.college_id) then
      new_uid := gen_random_uuid();

      -- 1. Create matching auth.users entry
      insert into auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) values (
        new_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        demo_users.email,
        '',
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', demo_users.name),
        now(),
        now()
      );

      -- 2. Create public profile entry
      insert into public.profiles (
        id,
        name,
        college_id,
        photo_url,
        gender,
        department,
        elo_rating,
        matches_played,
        wins,
        is_opted_in,
        is_admin,
        created_at,
        updated_at
      ) values (
        new_uid,
        demo_users.name,
        demo_users.college_id,
        demo_users.photo_url,
        demo_users.gender,
        demo_users.department,
        demo_users.elo_rating,
        demo_users.matches_played,
        demo_users.wins,
        true,
        false,
        now(),
        now()
      );
    end if;
  end loop;
end $$;
