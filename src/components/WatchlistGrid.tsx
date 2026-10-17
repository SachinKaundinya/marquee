'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Bookmark } from 'lucide-react';
import { useMedia } from '@/context/MediaContext';
import { MediaItem } from '@/types/media';
import { springTransition } from '@/tokens/motion';
import { MediaPoster } from '@/components/MediaPoster';

type FilterType = 'all' | 'movies' | 'tv' | 'short';

export function WatchlistGrid() {
  const { catalog, userTitles, openQuickLog, getUserTitle } = useMedia();
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<'watchlist' | 'explore'>('watchlist');

  // Filter items based on viewMode and active filter
  const items = (viewMode === 'watchlist'
    ? userTitles
        .filter((ut) => ut.status === 'want_to_watch')
        .map((ut) => ut.media)
        .filter((m): m is MediaItem => Boolean(m))
    : catalog
  ).filter((item) => {
    if (filter === 'movies') return item.media_type === 'movie';
    if (filter === 'tv') return item.media_type === 'tv';
    if (filter === 'short') return Boolean(item.runtime && item.runtime < 100);
    return true;
  });

  return (
    <section className="mb-12">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-white/[0.08]">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#14161B] p-1 rounded-lg border border-white/[0.08] w-fit">
          <button
            onClick={() => setViewMode('watchlist')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'watchlist'
                ? 'bg-[#F4F4F6] text-[#0A0B0D] shadow-sm'
                : 'text-[#8E93A0] hover:text-white'
            }`}
          >
            Watchlist ({userTitles.filter((u) => u.status === 'want_to_watch').length})
          </button>
          <button
            onClick={() => setViewMode('explore')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'explore'
                ? 'bg-[#F4F4F6] text-[#0A0B0D] shadow-sm'
                : 'text-[#8E93A0] hover:text-white'
            }`}
          >
            Explore Catalog ({catalog.length})
          </button>
        </div>

        {/* Filter Pills (Sticky horizontal bar) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 cursor-pointer ${
              filter === 'all'
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-white/[0.02] text-[#8E93A0] border-white/[0.06] hover:bg-white/[0.04]'
            }`}
          >
            All
          </button>

          <button
            onClick={() => setFilter('movies')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 cursor-pointer ${
              filter === 'movies'
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-white/[0.02] text-[#8E93A0] border-white/[0.06] hover:bg-white/[0.04]'
            }`}
          >
            Films
          </button>

          <button
            onClick={() => setFilter('tv')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 cursor-pointer ${
              filter === 'tv'
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-white/[0.02] text-[#8E93A0] border-white/[0.06] hover:bg-white/[0.04]'
            }`}
          >
            TV Series
          </button>

          <button
            onClick={() => setFilter('short')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 cursor-pointer ${
              filter === 'short'
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-white/[0.02] text-[#8E93A0] border-white/[0.06] hover:bg-white/[0.04]'
            }`}
          >
            Runtime &lt; 100m
          </button>
        </div>
      </div>

      {/* Grid Content */}
      {items.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#14161B] border border-white/[0.08]">
          <Bookmark className="w-8 h-8 text-[#8E93A0] mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-medium text-[#F3F4F6] mb-1">
            {viewMode === 'watchlist'
              ? 'Your watchlist is clear'
              : 'No matching titles found'}
          </h4>
          <p className="text-xs text-[#8E93A0] max-w-xs mx-auto mb-4">
            {viewMode === 'watchlist'
              ? 'Switch to Explore Catalog to discover titles to track.'
              : 'Try clearing active filters.'}
          </p>
          {viewMode === 'watchlist' && (
            <button
              onClick={() => setViewMode('explore')}
              className="px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-white transition-colors cursor-pointer"
            >
              Explore Titles
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item) => {
            const userTitle = getUserTitle(item.tmdb_id, item.media_type);
            const isWatching = userTitle?.status === 'watching';
            const isWatched = userTitle?.status === 'watched';

            return (
              <motion.div
                key={`${item.media_type}-${item.tmdb_id}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={springTransition}
                className="group flex flex-col cursor-pointer"
                onClick={() => openQuickLog(item)}
              >
                {/* Poster container with MediaPoster */}
                <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden bg-[#181A20] shadow-[0_4px_16px_rgba(0,0,0,0.4)] group-hover:border-white/20 transition-all">
                  <MediaPoster
                    src={item.poster_path}
                    title={item.title}
                    mediaType={item.media_type}
                    year={item.release_year}
                  />

                  {/* Status Indicator Chip */}
                  {userTitle && (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-white text-black text-[9px] font-bold uppercase tracking-wider shadow-sm z-20">
                      {isWatching ? 'Watching' : isWatched ? 'Watched' : 'Queue'}
                    </div>
                  )}

                  {/* Quick-action overlay button on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 z-20">
                    <span className="px-2.5 py-1 rounded bg-[#F4F4F6] text-[#0A0B0D] text-[11px] font-medium shadow-md">
                      Log Title
                    </span>
                  </div>
                </div>

                {/* Sub-text beneath poster */}
                <div className="mt-2 flex flex-col">
                  <h4 className="text-xs font-medium text-[#F3F4F6] truncate tracking-tight group-hover:text-white transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between mt-0.5 text-[11px] text-[#8E93A0]">
                    <span className="tabular-nums">{item.release_year}</span>
                    <div className="flex items-center gap-1 font-medium tabular-nums">
                      <Star className="w-3 h-3 fill-[#E5A93C] text-[#E5A93C]" />
                      <span className="text-[#F3F4F6]">{item.vote_average.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
