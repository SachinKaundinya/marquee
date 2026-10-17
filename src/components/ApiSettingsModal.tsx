'use client';

import React, { useState, useEffect } from 'react';
import { Key, X, Check, ExternalLink, Database } from 'lucide-react';
import { toast } from 'sonner';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiSettingsModal({ isOpen, onClose }: ApiSettingsModalProps) {
  const [tmdbKey, setTmdbKey] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('marquee_tmdb_key') || '';
      setTmdbKey(savedKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      const trimmed = tmdbKey.trim();
      if (trimmed) {
        localStorage.setItem('marquee_tmdb_key', trimmed);
        toast.success('TMDb API Key saved!', {
          description: 'Live catalog & search enabled across millions of titles.',
        });
      } else {
        localStorage.removeItem('marquee_tmdb_key');
        toast.info('TMDb API Key cleared. Using curated catalog.');
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-[#14161B] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.06)] p-6 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#8E93A0]" />
            <h3 className="text-base font-medium text-[#F3F4F6] tracking-tight">
              TMDb Database Connection
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8E93A0] hover:text-white hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#8E93A0] leading-relaxed mb-4">
          By default, Marquee includes a curated set of 25+ iconic titles. To instantly query and search millions of movies and TV shows with official posters, enter your free TMDb API Key or Read Access Token below.
        </p>

        <div className="mb-4">
          <label className="text-[11px] uppercase tracking-wider font-semibold text-[#8E93A0] mb-2 block">
            TMDb API Key or Token
          </label>
          <div className="relative">
            <Key className="w-4 h-4 text-[#8E93A0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={tmdbKey}
              onChange={(e) => setTmdbKey(e.target.value)}
              placeholder="e.g. 1a2b3c4d... or Bearer token"
              className="w-full bg-[#0D0E11] border border-white/[0.08] text-xs text-[#F3F4F6] pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:border-white/30 placeholder-[#636875]"
            />
          </div>
        </div>

        <a
          href="https://www.themoviedb.org/settings/api"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[#8E93A0] hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <span>Get a free TMDb API key at themoviedb.org</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-[#8E93A0] hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 px-3 rounded-lg bg-[#F4F4F6] hover:bg-white text-[#0A0B0D] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
}
