'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Bookmark, Check, SlidersHorizontal, Flame, Film, Tv, Trophy, Sparkles } from 'lucide-react';
import { useMedia } from '@/context/MediaContext';
import { MediaItem } from '@/types/media';
import { TmdbCategory } from '@/lib/tmdb';
import { springTransition } from '@/tokens/motion';
import { MediaPoster } from '@/components/MediaPoster';

type FilterType = 'all' | 'available' | 'movies' | 'tv' | 'short';

export function WatchlistGrid() {
  const {
    catalog,
    userTitles,
    openQuickLog,
    getUserTitle,
    isItemOnMyServices,
    isServiceSubscribed,
    openServicesModal,
    subscribedServices,
    selectedCategory,
    changeCategory,
    loadMoreCatalog,
    isCatalogLoading,
  } = useMedia();

  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<'watchlist' | 'explore'>('explore');

  const watchlistItems = userTitles
    .filter((ut) => ut.status === 'want_to_watch')
    .map((ut) => ut.media)
    .filter((m): m is MediaItem => Boolean(m));

  // Filter items based on viewMode and active filter
  const items = (viewMode === 'watchlist' ? watchlistItems : catalog).filter((item) => {
    if (filter === 'available') return isItemOnMyServices(item);
    if (filter === 'movies') return item.media_type === 'movie';
    if (filter === 'tv') return item.media_type === 'tv';
    if (filter === 'short') return Boolean(item.runtime && item.runtime < 100);
    return true;
  });

  const categories: { id: TmdbCategory; label: string; icon: any }[] = [
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'popular_movies', label: 'Popular Movies', icon: Film },
    { id: 'popular_tv', label: 'Popular TV', icon: Tv },
    { id: 'top_rated', label: 'Top Rated', icon: Trophy },
    { id: 'now_playing', label: 'In Theaters', icon: Sparkles },
  ];

  return (
    <section className="mb-12">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-white/[0.08]">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#14161B] p-1 rounded-lg border border-white/[0.08] w-fit">
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
          <button
            onClick={() => setViewMode('watchlist')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'watchlist'
                ? 'bg-[#F4F4F6] text-[#0A0B0D] shadow-sm'
                : 'text-[#8E93A0] hover:text-white'
            }`}
          >
            Watchlist ({watchlistItems.length})
          </button>
        </div>

        {/* Filter Pills & Services Trigger */}
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

          {/* Available on My Services Filter */}
          <button
            onClick={() => setFilter('available')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
              filter === 'available'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold shadow-sm'
                : 'bg-white/[0.02] text-[#8E93A0] border-white/[0.06] hover:bg-white/[0.04] hover:text-emerald-400'
            }`}
          >
            <Check className="w-3 h-3 stroke-[2.5]" />
            Available on My Services
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

          {/* Manage Services Button */}
          <button
            onClick={openServicesModal}
            title="Configure My Subscriptions"
            className="ml-1 px-2.5 py-1 rounded-full text-xs font-medium border border-white/[0.12] bg-white/[0.04] text-[#F3F4F6] hover:bg-white/[0.08] transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3 h-3 text-[#8E93A0]" />
            <span>My Services ({subscribedServices.length})</span>
          </button>
        </div>
      </div>

      {/* TMDb Live Feed Selector (When Exploring) */}
      {viewMode === 'explore' && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#636875] mr-1 shrink-0">
            TMDb Feed:
          </span>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => changeCategory(cat.id)}
                disabled={isCatalogLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'bg-[#14161B] text-[#8E93A0] hover:text-white border border-white/[0.06]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-[#8E93A0]'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Grid Content */}
      {items.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#14161B] border border-white/[0.08]">
          <Bookmark className="w-8 h-8 text-[#8E93A0] mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-medium text-[#F3F4F6] mb-1">
            {filter === 'available'
              ? 'No titles matching your active subscriptions'
              : viewMode === 'watchlist'
              ? 'Your Watchlist is empty'
              : 'No matching titles found'}
          </h4>
          <p className="text-xs text-[#8E93A0] max-w-sm mx-auto mb-4 leading-relaxed">
            {filter === 'available'
              ? 'Try selecting more subscriptions or switch filters to browse the entire catalog.'
              : viewMode === 'watchlist'
              ? 'Browse the Explore Catalog or search above to add movies and TV series you want to watch.'
              : 'Try clearing active filters or switching TMDb feeds.'}
          </p>
          {filter === 'available' ? (
            <button
              onClick={openServicesModal}
              className="px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-white transition-colors cursor-pointer"
            >
              Manage My Subscriptions
            </button>
          ) : viewMode === 'watchlist' ? (
            <button
              onClick={() => setViewMode('explore')}
              className="px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-white transition-colors cursor-pointer"
            >
              Explore Trending Titles
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item) => {
              const userTitle = getUserTitle(item.tmdb_id, item.media_type);
              const isWatching = userTitle?.status === 'watching';
              const isWatched = userTitle?.status === 'watched';
              const source = item.primary_source || item.streaming_sources?.[0];
              const isSubscribed = source ? isServiceSubscribed(source) : false;

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

                    {/* Where to Watch Micro-Badge (Top Left) */}
                    {source && (
                      <div
                        className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-tight z-20 backdrop-blur-md flex items-center gap-1 shadow-md ${
                          isSubscribed
                            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                            : 'bg-black/85 text-[#F3F4F6] border border-white/10'
                        }`}
                      >
                        {isSubscribed && <Check className="w-2.5 h-2.5 stroke-[3] text-emerald-400" />}
                        <span>{source}</span>
                      </div>
                    )}

                    {/* Status Indicator Chip (Top Right) */}
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

          {/* Load More Button for Explore Mode */}
          {viewMode === 'explore' && (
            <div className="mt-10 flex flex-col items-center justify-center gap-2">
              <button
                type="button"
                onClick={loadMoreCatalog}
                disabled={isCatalogLoading}
                className="px-6 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-medium text-[#F3F4F6] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {isCatalogLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <span>Fetching titles from TMDb...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Titles ({catalog.length} Loaded)</span>
                  </>
                )}
              </button>
              <span className="text-[11px] text-[#636875] tabular-nums">
                Connected to TMDb live catalog • Infinite pagination enabled
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
}
