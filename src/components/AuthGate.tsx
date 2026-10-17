'use client';

import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import { Film, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { springTransition } from '@/tokens/motion';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const {
    user,
    isLoading,
    signInWithGoogle,
    signInWithGoogleCredential,
  } = useAuth();

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
              Authenticate with your Google account to access your personal entertainment tracker and diary.
            </p>
          </div>

          {/* Consumer Google Sign-In Action */}
          <div className="space-y-3 mb-6">
            {/* Primary Google Login Button */}
            <button
              type="button"
              onClick={signInWithGoogle}
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
              <span className="font-semibold">Sign in with Google</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>

            {/* Official Google GSI Button */}
            <div className="flex justify-center w-full pt-1">
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
