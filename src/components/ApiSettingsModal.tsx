'use client';

import React, { useState, useEffect } from 'react';
import { Key, X, Check, ExternalLink, Database, Film } from 'lucide-react';
import { toast } from 'sonner';
import { getOmdbKey } from '@/lib/omdb';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiSettingsModal({ isOpen, onClose }: ApiSettingsModalProps) {
  const [omdbKey, setOmdbKey] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeKey = getOmdbKey();
      setOmdbKey(activeKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      const trimmed = omdbKey.trim();
      if (trimmed) {
        localStorage.setItem('marquee_omdb_key', trimmed);
        toast.success('OMDb API Key saved!', {
          description: 'Live IMDb database search & posters active.',
        });
      } else {
        localStorage.removeItem('marquee_omdb_key');
        toast.info('Using default configured OMDb API key.');
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
            <Film className="w-4 h-4 text-[#8E93A0]" />
            <h3 className="text-base font-medium text-[#F3F4F6] tracking-tight">
              Entertainment Database Connection
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8E93A0] hover:text-white hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-emerald-300">
              Live OMDb (IMDb) API Connected
            </span>
            Real official Amazon/IMDb CDN posters and metadata are active across all searches and titles.
          </div>
        </div>

        <div className="mb-4">
          <label className="text-[11px] uppercase tracking-wider font-semibold text-[#8E93A0] mb-2 block">
            Active OMDb API Key
          </label>
          <div className="relative">
            <Key className="w-4 h-4 text-[#8E93A0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={omdbKey}
              onChange={(e) => setOmdbKey(e.target.value)}
              placeholder="e.g. 44535897"
              className="w-full bg-[#0D0E11] border border-white/[0.08] text-xs text-[#F3F4F6] pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:border-white/30 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-[#8E93A0] hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 px-3 rounded-lg bg-[#F4F4F6] hover:bg-white text-[#0A0B0D] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
}
