'use client';

import React, { useState } from 'react';
import { Search, Upload, X, Database, LogOut } from 'lucide-react';
import { useMedia } from '@/context/MediaContext';
import { useAuth } from '@/context/AuthContext';
import { searchTitles } from '@/lib/tmdb';
import { MediaItem } from '@/types/media';

interface NavbarProps {
  activeTab: 'shelf' | 'diary' | 'explore';
  setActiveTab: (tab: 'shelf' | 'diary' | 'explore') => void;
  onOpenImport: () => void;
  onOpenApiSettings: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenImport,
  onOpenApiSettings,
}: NavbarProps) {
  const { openQuickLog } = useMedia();
  const { user, signInWithGoogle, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (q.trim().length > 1) {
      const results = await searchTitles(q);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectResult = (item: MediaItem) => {
    openQuickLog(item);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <header className="sticky top-0 z-40 marquee-header">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => setActiveTab('shelf')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="w-5 h-5 rounded bg-white text-black font-bold text-xs flex items-center justify-center tracking-tighter">
              M
            </div>
            <span className="text-sm font-semibold tracking-[0.16em] uppercase text-[#F3F4F6] group-hover:text-white transition-colors">
              Marquee
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('shelf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'shelf'
                  ? 'bg-white/10 text-white'
                  : 'text-[#8E93A0] hover:text-[#F3F4F6] hover:bg-white/[0.04]'
              }`}
            >
              Command Center
            </button>
            <button
              onClick={() => setActiveTab('diary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'diary'
                  ? 'bg-white/10 text-white'
                  : 'text-[#8E93A0] hover:text-[#F3F4F6] hover:bg-white/[0.04]'
              }`}
            >
              Diary
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-white/10 text-white'
                  : 'text-[#8E93A0] hover:text-[#F3F4F6] hover:bg-white/[0.04]'
              }`}
            >
              Explore
            </button>
          </nav>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search */}
          <div className="relative w-40 sm:w-56 md:w-64">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#8E93A0] absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search film or TV..."
                className="w-full bg-[#14161B] border border-white/[0.08] text-xs text-[#F3F4F6] pl-8 pr-7 py-1.5 rounded-lg focus:outline-none focus:border-white/25 placeholder-[#636875] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-2 p-0.5 text-[#8E93A0] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Dropdown Results */}
            {searchQuery && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl bg-[#14161B] border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.8)] py-1 max-h-80 overflow-y-auto z-50">
                {searchResults.map((item) => (
                  <div
                    key={`${item.media_type}-${item.tmdb_id}`}
                    onClick={() => handleSelectResult(item)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-white/[0.06] cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-[#F3F4F6] truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#8E93A0] tabular-nums">
                        {item.media_type === 'movie' ? 'Film' : 'TV'} • {item.release_year}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Database API Connect */}
          <button
            onClick={onOpenApiSettings}
            title="Configure Entertainment Database API"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-[#8E93A0] hover:text-white transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">OMDb / IMDb API</span>
          </button>

          {/* Import CSV Trigger */}
          <button
            onClick={onOpenImport}
            title="Import from Letterboxd or IMDb"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-[#8E93A0] hover:text-white transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          {/* Google Sign In / User Profile */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-white/[0.08]">
              <div className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/20 overflow-hidden shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">
                    {user.name[0]}
                  </div>
                )}
              </div>
              <button
                onClick={signOut}
                title="Sign out"
                className="p-1.5 rounded-lg text-[#8E93A0] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F3F4F6] text-[#0A0B0D] text-xs font-medium transition-all shadow-sm cursor-pointer shrink-0"
            >
              {/* Google SVG Logo */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
