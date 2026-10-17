'use client';

import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import { Film, CheckCircle2, Key, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { springTransition } from '@/tokens/motion';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const {
    user,
    isLoading,
    googleClientId,
    setGoogleClientId,
    signInWithGoogle,
    signInWithGoogleCredential,
  } = useAuth();

  const [inputClientId, setInputClientId] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [emailInput, setEmailInput] = useState('sachin.bhattiprolu@gmail.com');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-[#8E93A0] tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Loading Marquee...
        </div>
      </div>
    );
  }

  // Once authenticated, unlock the full application
  if (user) {
    return <>{children}</>;
  }

  // Forced Authentication Gate
  const handleSaveClientId = () => {
    if (inputClientId.trim()) {
      setGoogleClientId(inputClientId.trim());
      setShowConfig(false);
    }
  };

  const handleGoogleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    signInWithGoogle(emailInput);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#F3F4F6] flex flex-col justify-between selection:bg-white/20 selection:text-white relative overflow-hidden">
      {/* Subtle atmospheric backdrop lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-gradient-to-b from-white/[0.05] to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="p-6 max-w-6xl w-full mx-auto flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 select-none">
          <div className="w-5 h-5 rounded bg-white text-black font-bold text-xs flex items-center justify-center tracking-tighter">
            M
          </div>
          <span className="text-sm font-semibold tracking-[0.16em] uppercase text-[#F3F4F6]">
            Marquee
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#8E93A0]">
          <Lock className="w-3.5 h-3.5" />
          <span>Members Only</span>
        </div>
      </header>

      {/* Centered Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="w-full max-w-md rounded-2xl bg-[#14161B] border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.06)] p-7 sm:p-8 flex flex-col"
        >
          {/* Logo Badge */}
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-5 mx-auto text-white shadow-inner">
            <Film className="w-6 h-6 stroke-[1.5]" />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-[#F3F4F6] mb-1.5">
              Sign in to Marquee
            </h1>
            <p className="text-xs text-[#8E93A0] leading-relaxed max-w-xs mx-auto">
              An intentional, craft-driven entertainment tracker for cinema and television.
            </p>
          </div>

          {/* Real Google OAuth Login & Instant Authentication */}
          <div className="space-y-4 mb-6">
            {googleClientId && googleClientId !== 'PLACEHOLDER_CLIENT_ID' ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex justify-center w-full py-1">
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      if (credentialResponse.credential) {
                        signInWithGoogleCredential(credentialResponse.credential);
                      }
                    }}
                    onError={() => {
                      console.error('Google Sign-In Failed');
                    }}
                    theme="filled_black"
                    shape="rectangular"
                    size="large"
                    text="continue_with"
                    width="340"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleGoogleSubmit()}
                  className="text-xs text-[#8E93A0] hover:text-white underline cursor-pointer"
                >
                  Quick Enter with {emailInput}
                </button>
              </div>
            ) : (
              <form onSubmit={handleGoogleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#8E93A0] uppercase tracking-wider block">
                    Google Account
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full bg-[#0D0E11] border border-white/[0.08] text-xs text-[#F3F4F6] px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#F3F4F6] text-[#0A0B0D] font-medium text-xs flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer active:scale-[0.98]"
                >
                  {/* Google SVG Logo */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Sign in with Google Account</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5 opacity-60" />
                </button>

                <div className="pt-2 flex items-center justify-between text-[11px] text-[#8E93A0]">
                  <button
                    type="button"
                    onClick={() => setShowConfig(!showConfig)}
                    className="hover:text-white underline cursor-pointer flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" />
                    <span>{showConfig ? 'Hide Client ID Settings' : 'Custom Google Cloud Client ID'}</span>
                  </button>
                </div>

                {showConfig && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-3"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-[#F3F4F6] font-medium">
                      <Key className="w-3.5 h-3.5 text-[#8E93A0]" />
                      <span>Google Cloud Client ID</span>
                    </div>
                    <p className="text-[11px] text-[#8E93A0] leading-relaxed">
                      To connect your Google Cloud OAuth client, paste your Client ID (e.g. <span className="font-mono text-white/70">xxxx.apps.googleusercontent.com</span>):
                    </p>
                    <input
                      type="text"
                      value={inputClientId}
                      onChange={(e) => setInputClientId(e.target.value)}
                      placeholder="Paste Google Client ID..."
                      className="w-full bg-[#0D0E11] border border-white/[0.08] text-xs text-[#F3F4F6] px-3 py-2 rounded-lg focus:outline-none focus:border-white/30 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveClientId}
                      className="w-full py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white font-medium transition-colors cursor-pointer"
                    >
                      Connect Real Google OAuth
                    </button>
                  </motion.div>
                )}
              </form>
            )}
          </div>

          {/* Pillars List */}
          <div className="pt-5 border-t border-white/[0.08] space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-[#8E93A0]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Title-Level Parity — No episode tracking chores</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#8E93A0]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Live streaming availability matching your subscriptions</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#8E93A0]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Half-star diary ritual with Letterboxd & IMDb sync</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-[11px] text-[#636875] relative z-10">
        Marquee • Strictly Title-Level Entertainment Tracker
      </footer>
    </div>
  );
}
