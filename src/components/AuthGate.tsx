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
            {/* Official Google Button */}
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
