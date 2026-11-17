import { useState } from 'react';
import { Trophy, User as UserIcon, ShieldAlert, Loader2 } from 'lucide-react';
import { MirrorIcon } from './components/common/MirrorIcon';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { TermsAgreement } from './components/onboarding/TermsAgreement';
import { ProfileSetup } from './components/onboarding/ProfileSetup';
import { ArenaView } from './components/arena/ArenaView';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { ProfileView } from './components/profile/ProfileView';
import { AdminDashboard } from './components/admin/AdminDashboard';

type Tab = 'arena' | 'standings' | 'profile' | 'admin';

function AppContent() {
  const { user, profile, loading, termsAcceptedSession } = useAuth();
  // Default primary screen is the Matchup Arena!
  const [activeTab, setActiveTab] = useState<Tab>('arena');

  // 1. Initial Authentication & Profile Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="animate-pulse flex items-center justify-center">
          <MirrorIcon className="w-14 h-14" useGradient />
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-[#ff5864]" />
          <span>Entering Kannadi...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated -> Show Login Landing
  if (!user) {
    return <LoginView />;
  }

  // 3. Authenticated but Incomplete Profile -> Funnel through Onboarding
  if (!profile) {
    if (!termsAcceptedSession) {
      return <TermsAgreement />;
    }
    return <ProfileSetup />;
  }

  // 4. Authenticated & Profile Active -> Main App Shell with Bottom Navigation
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-[#ff5864] selection:text-white">
      {/* Top Brand Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="max-w-md sm:max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div
            onClick={() => setActiveTab('arena')}
            className="flex items-center space-x-2.5 cursor-pointer select-none"
          >
            <MirrorIcon className="w-7 h-7" useGradient />
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-[#fd297b] via-[#ff5864] to-[#ff655b] bg-clip-text text-transparent">
              Kannadi
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700">
              {profile.elo_rating} pts
            </span>

            {profile.is_admin && (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[#ff5864] text-[10px] font-bold uppercase tracking-wider">
                Admin
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Viewport Content Area */}
      <main className="flex-1 flex flex-col w-full">
        {activeTab === 'arena' && (
          <ArenaView
            onViewLeaderboard={() => setActiveTab('standings')}
          />
        )}

        {activeTab === 'standings' && (
          <LeaderboardView
            onEnterArena={() => setActiveTab('arena')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            onOpenAdmin={profile.is_admin ? () => setActiveTab('admin') : undefined}
          />
        )}

        {activeTab === 'admin' && profile.is_admin && (
          <AdminDashboard />
        )}
      </main>

      {/* Persistent Floating Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t border-slate-200/80 backdrop-blur-xl safe-area-pb shadow-lg shadow-slate-300/40">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-around">
          {/* Tab 1: Matchups */}
          <button
            onClick={() => setActiveTab('arena')}
            className={`flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
              activeTab === 'arena' ? 'text-[#ff5864] scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MirrorIcon className="w-6 h-6" />
            <span className="text-[10px] font-extrabold">Matchups</span>
          </button>

          {/* Tab 2: Standings */}
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
              activeTab === 'standings' ? 'text-amber-500 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Trophy className="w-6 h-6" />
            <span className="text-[10px] font-extrabold">Standings</span>
          </button>

          {/* Tab 3: Profile */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
              activeTab === 'profile' ? 'text-slate-900 scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserIcon className="w-6 h-6" />
            <span className="text-[10px] font-extrabold">Profile</span>
          </button>

          {/* Tab 4: Admin (if admin) */}
          {profile.is_admin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                activeTab === 'admin' ? 'text-rose-600 scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ShieldAlert className="w-6 h-6" />
              <span className="text-[10px] font-extrabold">Admin</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
