import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, ShieldCheck, Trophy } from 'lucide-react';
import { MirrorIcon } from '../common/MirrorIcon';
import { useAuth } from '../../context/AuthContext';

export function LoginView() {
  const { signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Failed to initialize Google authentication');
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-svh bg-[#f8fafc] text-slate-900 flex flex-col justify-between px-4 py-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-[#ff5864]/10 via-[#fd297b]/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <MirrorIcon className="w-8 h-8" useGradient />
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">Kannadi</span>
            <span className="text-xs text-slate-400 ml-1 font-medium">കണ്ണാടി</span>
          </div>
        </div>

        <span className="text-[11px] font-bold text-slate-500 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-sm">
          Campus Showcase
        </span>
      </header>

      {/* Hero Center */}
      <main className="relative z-10 w-full max-w-sm mx-auto text-center space-y-6 my-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          {/* Mirror Logo */}
          <div className="mx-auto flex items-center justify-center py-2">
            <MirrorIcon className="w-20 h-20" useGradient />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              The Campus Mirror
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
              Simple, clean peer matchups. Compare profiles and discover campus favorites.
            </p>
          </div>
        </motion.div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs text-left shadow-sm">
            {errorMsg}
          </div>
        )}

        {/* Google Sign In Button */}
        <div className="pt-2">
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-sm transition-all shadow-xl shadow-slate-200/80 border border-slate-200/80 flex items-center justify-center space-x-3 cursor-pointer active:scale-98 disabled:opacity-75"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                <span>Connecting with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </>
            )}
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-3 gap-2 pt-4 text-center text-[10px] text-slate-600">
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <MirrorIcon className="w-4 h-4 mx-auto text-[#ff5864] mb-1" />
            <span className="font-bold block">Matchups</span>
            <span className="text-slate-400 text-[9px]">Tap to choose</span>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <ShieldCheck className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
            <span className="font-bold block">Authentic</span>
            <span className="text-slate-400 text-[9px]">Verified peers</span>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <Trophy className="w-4 h-4 mx-auto text-amber-500 mb-1" />
            <span className="font-bold block">Standings</span>
            <span className="text-slate-400 text-[9px]">Live ranks</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-400">
        Kannadi &copy; {new Date().getFullYear()} &bull; College Peer Showcase
      </footer>
    </div>
  );
}
