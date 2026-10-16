'use client';

import React, { useState } from 'react';
import { Search, Upload, Film, Tv, Sparkles, X } from 'lucide-react';
import { useMedia } from '@/context/MediaContext';
import { searchTitles } from '@/lib/tmdb';
import { MediaItem } from '@/types/media';

interface NavbarProps {
  activeTab: 'shelf' | 'diary' | 'explore';
  setActiveTab: (tab: 'shelf' | 'diary' | 'explore') => void;
  onOpenImport: () => void;
}

export function Navbar({ activeTab, setActiveTab, onOpenImport }: NavbarProps) {
  const { openQuickLog } = useMedia();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (q.trim().length > 1) {
      setIsSearching(true);
      const results = await searchTitles(q);
      setSearchResults(results);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectResult = (item: MediaItem) => {
    openQuickLog(item);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'shelf'
                  ? 'bg-white/10 text-white'
                  : 'text-[#8E93A0] hover:text-[#F3F4F6] hover:bg-white/[0.04]'
              }`}
            >
              Command Center
            </button>
            <button
              onClick={() => setActiveTab('diary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'diary'
                  ? 'bg-white/10 text-white'
                  : 'text-[#8E93A0] hover:text-[#F3F4F6] hover:bg-white/[0.04]'
              }`}
            >
              Diary
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative w-48 sm:w-64">
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
                    <div className="w-7 h-10 rounded overflow-hidden bg-black/40 shrink-0 border border-white/[0.06]">
                      <img
                        src={item.poster_path}
                        alt={item.title}
                        className="w-full h-full object-cover brightness-[0.96]"
                      />
                    </div>
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

          {/* Import CSV Trigger */}
          <button
            onClick={onOpenImport}
            title="Import from Letterboxd or IMDb"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-[#8E93A0] hover:text-white transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>
        </div>
      </div>
    </header>
  );
}
