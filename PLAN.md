# Kannadi (കണ്ണാടി) — Implementation Plan

This roadmap outlines the end-to-end implementation across distinct phases, broken down into actionable tasks and sub-tasks.

---

## Phase 0: Manual Prerequisites & External Credentials Setup

Before running code, configure the external Google OAuth and Supabase services.

- [ ] **Task 0.1: Google Cloud Console Configuration**
  - [ ] 0.1.1 Create a new Google Cloud project (e.g., `kannadi-app`).
  - [ ] 0.1.2 Configure the **OAuth Consent Screen** (User Type: External, enter App Name and Support Email).
  - [ ] 0.1.3 Create **OAuth 2.0 Client ID** (Application Type: *Web application*).
  - [ ] 0.1.4 Set Authorized Redirect URI: `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`.
  - [ ] 0.1.5 Note down the generated `Client ID` and `Client Secret`.

- [ ] **Task 0.2: Supabase Project Setup**
  - [ ] 0.2.1 Create a new project on [Supabase.com](https://supabase.com).
  - [ ] 0.2.2 Navigate to **Authentication > Providers > Google**, toggle Enable, and enter `Client ID` & `Client Secret`.
  - [ ] 0.2.3 Navigate to **Storage**, create a new bucket named `avatars`, and toggle **Public bucket** to `ON`.
  - [ ] 0.2.4 Navigate to **Project Settings > API**, copy `Project URL` and `publishable` key.

---

## Phase 1: Project Scaffolding & Tooling Setup

Initialize the repository with modern React and Tailwind styling.

- [x] **Task 1.1: Initialize React & TypeScript Environment**
  - [x] 1.1.1 Scaffold Vite template: React 19 + TypeScript.
  - [x] 1.1.2 Install core dependencies: `@supabase/supabase-js`, `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`, `canvas-confetti`.
  - [x] 1.1.3 Install dev dependencies: `tailwindcss`, `@tailwindcss/vite`, `@types/canvas-confetti`.
  - [x] 1.1.4 Configure Tailwind CSS v4 in `vite.config.ts` and `src/index.css`.

- [x] **Task 1.2: Environment & Client Foundation**
  - [x] 1.2.1 Create `.env.example` and local `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
  - [x] 1.2.2 Create `src/lib/supabase.ts` singleton client with configuration state detection.
  - [x] 1.2.3 Define TypeScript domain interfaces in `src/types/index.ts` (`Profile`, `Vote`, `AdminLog`, `MatchupState`).

---

## Phase 2: Database Migration & Security Deployment

Apply the schema, atomic stored procedures, and Row-Level Security rules.

- [x] **Task 2.1: Execute Core Tables & Indexes Migration**
  - [x] 2.1.1 Create `public.profiles` table with constraints and indexes (generated in `supabase/schema.sql`).
  - [x] 2.1.2 Create `public.votes` log table.
  - [x] 2.1.3 Create `public.admin_logs` table.
  - [x] 2.1.4 Add `is_admin()` helper function.

- [x] **Task 2.2: Deploy Stored Procedures (RPC)**
  - [x] 2.2.1 Deploy atomic `submit_matchup_vote(winner_id, loser_id)` with row-level update locking.
  - [x] 2.2.2 Deploy matchmaking procedure `get_next_challenger(king_id, excluded_ids)` with cold-start boost.
  - [x] 2.2.3 Deploy admin procedures `admin_delete_profile` and `admin_adjust_elo`.

- [x] **Task 2.3: Configure Row-Level Security (RLS) & Storage**
  - [x] 2.3.1 Enable RLS on `profiles`, `votes`, and `admin_logs`.
  - [x] 2.3.2 Apply read/write policies enforcing irrevocable registration (no user deletes allowed).
  - [x] 2.3.3 Apply administrative privilege overrides.
  - [x] 2.3.4 Apply `avatars` bucket storage upload, read, and admin-delete policies.
  - [x] 2.3.5 Automated connectivity verification script in `scripts/verify-supabase.js` (`npm run verify:db`).

---

## Phase 3: Authentication & Irrevocable Onboarding Flow

Build the login gate and the point-of-no-return onboarding experience.

- [x] **Task 3.1: Auth State & Context**
  - [x] 3.1.1 Build `AuthProvider` context in `src/context/AuthContext.tsx` listening to Supabase `onAuthStateChange`.
  - [x] 3.1.2 Create Google Sign-In button and authentication error banner in `src/components/auth/LoginView.tsx`.

- [x] **Task 3.2: Rules & Irrevocable Agreement Gate**
  - [x] 3.2.1 Build the mandatory Rules of Engagement screen (`src/components/onboarding/TermsAgreement.tsx`).
  - [x] 3.2.2 Present terms: No lurker voters, strict mutual participation, irrevocable photo entry.
  - [x] 3.2.3 Implement "Accept & Enter" vs "Decline & Sign Out" actions.

- [x] **Task 3.3: Profile Creation & Image Upload**
  - [x] 3.3.1 Create profile form: Full Name, College ID, optional Department/Gender in `src/components/onboarding/ProfileSetup.tsx`.
  - [x] 3.3.2 Implement client-side image compression utility using HTML5 Canvas (`src/utils/imageCompressor.ts` downscales to 1000px JPEG).
  - [x] 3.3.3 Upload compressed avatar to Supabase `avatars` bucket and save public URL into `public.profiles`.

---

## Phase 4: Game Arena UI & King-of-the-Hill Engine

Implement the core comparison interface and rapid animations.

- [x] **Task 4.1: Matchup State Machine**
  - [x] 4.1.1 Build `useMatchup` hook managing current King, current Challenger, and session vote history in `src/hooks/useMatchup.ts`.
  - [x] 4.1.2 Implement round tracker (Progress bar: Round 1 through 15).
  - [x] 4.1.3 Prevent duplicate encounters within the active session.

- [x] **Task 4.2: Comparison Cards & Framer Motion Gestures**
  - [x] 4.2.1 Build `MatchupCard.tsx` showcasing high-res photo, name, and department badge in `src/components/arena/MatchupCard.tsx`.
  - [x] 4.2.2 Create exit animation for the loser (slides off screen with fade).
  - [x] 4.2.3 Create entrance animation for the challenger (slides in smoothly).
  - [x] 4.2.4 Implement winner "King streak" indicator 🔥 on the retained card.

- [x] **Task 4.3: Zero-Flicker Image Pipeline**
  - [x] 4.3.1 Implement background challenger pre-fetcher (`new Image().src = nextCandidate.photo_url`).
  - [x] 4.3.2 Fire `submit_matchup_vote` RPC asynchronously without delaying animation transitions.
  - [x] 4.3.3 Implement `SessionSummary.tsx` with celebratory confetti upon round 15 completion.

---

## Phase 5: Session Completion & Campus Leaderboard

Provide instant feedback upon completing 15 rounds and show rankings.

- [x] **Task 5.1: Round Completion Screen**
  - [x] 5.1.1 Trigger `canvas-confetti` explosion upon round completion.
  - [x] 5.1.2 Show session summary card: Matchups voted, current user's Elo and percentile ranking.
  - [x] 5.1.3 Add CTA buttons: "View Campus Leaderboard" and "Play Another Session" in `src/components/arena/SessionSummary.tsx`.

- [x] **Task 5.2: Leaderboard & Personal Standing**
  - [x] 5.2.1 Build `LeaderboardView.tsx` displaying Top 3 podiums and Top 20 ranked profiles.
  - [x] 5.2.2 Display user's personal sticky banner at bottom calculating private percentile rank (e.g. `Top 25%`).
  - [x] 5.2.3 Implement department filter pills and manual pull-to-refresh.

---

## Phase 6: Admin Dashboard & Moderation System

Empower administrators to manage the community, moderate photos, and audit votes.

- [x] **Task 6.1: Route Guard & Admin Verification**
  - [x] 6.1.1 Enforce admin authorization guard checking `profile.is_admin === true` paired with Postgres RPC verification (`public.is_admin()`).
  - [x] 6.1.2 Provide sleek Access Denied screen with instructions to elevate in Supabase SQL Editor.

- [x] **Task 6.2: Metrics & KPI Overview**
  - [x] 6.2.1 Display live KPI cards: Total enrolled students, total votes cast, campus average Elo, active participants.

- [x] **Task 6.3: User Moderation Table**
  - [x] 6.3.1 Build searchable table filtering by Name, College ID, or Department in `src/components/admin/UserModerationTable.tsx`.
  - [x] 6.3.2 Implement `PhotoInspectModal.tsx` for high-res photo inspection.
  - [x] 6.3.3 Implement `ConfirmPurgeModal.tsx` invoking `admin_delete_profile` with audit logging.
  - [x] 6.3.4 Implement `AdjustEloModal.tsx` invoking `admin_adjust_elo` with mandatory audit reason.
  - [x] 6.3.5 Implement 1-click active matchmaking visibility toggle (`is_opted_in`).

- [x] **Task 6.4: Real-time Activity Stream & Audit Logs**
  - [x] 6.4.1 Real-time vote feed in `src/components/admin/VoteStreamView.tsx` showing the latest 30 head-to-head outcomes.
  - [x] 6.4.2 Immutable audit history in `src/components/admin/AuditTrailView.tsx` tracking administrative actions.

---

## Phase 7: Polish, Performance & Production Deployment

Final hardening before sharing with college peers.

- [ ] **Task 7.1: Mobile Ergonomics & PWA Optimization**
  - [ ] 7.1.1 Optimize touch hit-boxes for single-thumb voting on mobile devices.
  - [ ] 7.1.2 Prevent accidental double-tap zoom and pull-to-refresh during voting.
  - [ ] 7.1.3 Add web manifest and mobile app icons.

- [ ] **Task 7.2: Production Build & Hosting**
  - [ ] 7.2.1 Run TypeScript type check and production Vite build: `npm run build`.
  - [ ] 7.2.2 Deploy frontend to Vercel / Netlify / Cloudflare Pages.
  - [ ] 7.2.3 Update Supabase Authorized Site URLs with the production domain.
