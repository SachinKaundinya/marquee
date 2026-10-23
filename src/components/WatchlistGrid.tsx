'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Bookmark, Check, SlidersHorizontal, Flame, Film, Tv, Trophy, Sparkles, Filter, X, ChevronDown, Plus, Share2, Clapperboard, Calendar, Globe } from 'lucide-react';
import { useMedia } from '@/context/MediaContext';
import { MediaItem } from '@/types/media';
import { TmdbCategory, isAnimeItem, isNonEnglishItem } from '@/lib/tmdb';
import { springTransition } from '@/tokens/motion';
import { MediaPoster } from '@/components/MediaPoster';
import { GenreFilterModal } from '@/components/GenreFilterModal';
import { DecadeFilterModal, DECADE_OPTIONS, matchesDecades } from '@/components/DecadeFilterModal';
import { toast } from 'sonner';

type FilterType = 'all' | 'available' | 'movies' | 'tv' | 'short';

interface WatchlistGridProps {
  mode?: 'popular' | 'watchlist';
  onSwitchToPopular?: () => void;
}

function matchesGenres(itemGenres: string[], selected: string[], itemOverview = ''): boolean {
  if (selected.length === 0) return true;
  return itemGenres.some((ig) =>
    selected.some((s) => {
      const g1 = ig.toLowerCase().replace(/[^a-z0-9]/g, '');
      const g2 = s.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (g1 === g2) return true;
      if (g1.includes(g2) || g2.includes(g1)) return true;
      if ((g1.includes('scifi') || g1.includes('sciencefiction')) && (g2.includes('scifi') || g2.includes('sciencefiction'))) return true;
      if (g1.includes('reality') && g2.includes('reality')) return true;
      if (g1.includes('talk') && g2.includes('talk')) return true;
      if (g1.includes('game') && g2.includes('game')) return true;
      if (g1.includes('noir') && g2.includes('noir')) return true;
      if (g2.includes('truecrime') || g1.includes('truecrime')) {
        if (g1.includes('truecrime') && g2.includes('truecrime')) return true;
        if (itemGenres.some((x) => x.toLowerCase().includes('crime')) &&
            (itemGenres.some((x) => x.toLowerCase().includes('doc')) || itemGenres.some((x) => x.toLowerCase().includes('biography')))) {
          return true;
        }
        const ov = itemOverview.toLowerCase();
        if (ov.includes('true crime') || ov.includes('serial killer') || ov.includes('true story') || ov.includes('real-life')) {
          return true;
        }
      }
      return false;
    })
  );
}

export function WatchlistGrid({ mode = 'popular', onSwitchToPopular }: WatchlistGridProps) {
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
    triggerSearchFocus,
  } = useMedia();

  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [selectedDecades, setSelectedDecades] = useState<string[]>([]);
  const [isDecadeModalOpen, setIsDecadeModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const isWatchlistMode = mode === 'watchlist';

  const handleShareList = async () => {
    try {
      const shareId = Math.random().toString(36).substring(2, 9);
      const url = `${window.location.origin}/?watchlist=${shareId}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      }
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
      toast.success('Shareable link copied to clipboard!', {
        description: url,
      });
    } catch {
      toast.info('Watchlist share link ready');
    }
  };

  // Set of tracked titles (Watchlist, Watched/Diary, Now Watching)
  const userTrackedKeys = React.useMemo(() => {
    const set = new Set<string>();
    userTitles.forEach((ut) => {
      if (['want_to_watch', 'watched', 'watching'].includes(ut.status)) {
        set.add(`${ut.media_type}-${ut.tmdb_id}`);
      }
    });
    return set;
  }, [userTitles]);

  const watchlistItems = userTitles
    .filter((ut) => ut.status === 'want_to_watch')
    .map((ut) => ut.media)
    .filter((m): m is MediaItem => Boolean(m));

  const watchlistMovieCount = React.useMemo(
    () => watchlistItems.filter((i) => i.media_type === 'movie').length,
    [watchlistItems]
  );
  const watchlistTvCount = React.useMemo(
    () => watchlistItems.filter((i) => i.media_type === 'tv').length,
    [watchlistItems]
  );

  // In Popular mode, immediately exclude any title added to Watchlist or Diary, and exclude Anime
  const baseItems = isWatchlistMode
    ? watchlistItems
    : catalog.filter((item) => {
        const key = `${item.media_type}-${item.tmdb_id}`;
        if (userTrackedKeys.has(key)) return false;
        if (isAnimeItem(item)) return false;
        if (selectedCategory !== 'international' && isNonEnglishItem(item)) return false;
        if (selectedCategory === 'taste_match') {
          const isDoc = (item.genres || []).some(
            (g) => g.toLowerCase().includes('doc') || g.toLowerCase() === 'documentary'
          );
          if (isDoc) return false;
        }
        return true;
      });

  // Filter items based on format filter and genre multi-select
  const filteredItems = baseItems
    .filter((item) => {
      if (filter === 'available') return isItemOnMyServices(item);
      if (filter === 'movies') return item.media_type === 'movie';
      if (filter === 'tv') return item.media_type === 'tv';
      if (filter === 'short') return Boolean(item.runtime && item.runtime < 100);
      return true;
    })
    .filter((item) => matchesGenres(item.genres, selectedGenres, item.overview || ''))
    .filter((item) => matchesDecades(item.release_year, selectedDecades));

  const [visibleCount, setVisibleCount] = useState(30);

  // Reset visibleCount when switching category, tab mode, or filters for instant responsiveness & low memory
  React.useEffect(() => {
    setVisibleCount(30);
  }, [selectedCategory, filter, selectedGenres, selectedDecades, mode]);

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const isLoadingRef = React.useRef(isCatalogLoading);
  React.useEffect(() => {
    isLoadingRef.current = isCatalogLoading;
  }, [isCatalogLoading]);

  // Background infinite pagination using IntersectionObserver: silent, seamless pre-fetching & progressive rendering
  React.useEffect(() => {
    if (isWatchlistMode) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => prev + 24);
          // Only fetch more from TMDb if not currently loading and we have a full page already
          if (!isLoadingRef.current && filteredItems.length >= 20) {
            loadMoreCatalog();
          }
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isWatchlistMode, loadMoreCatalog, filteredItems.length]);

  function getRatingTier(voteAverage: number): number {
    if (voteAverage >= 8.0) return 3; // 8.0+
    if (voteAverage >= 7.0) return 2; // 7.0 - 7.9
    if (voteAverage >= 6.0) return 1; // 6.0 - 6.9
    return 0; // below 6.0
  }

  // In For You / Popular mode, recommend titles rated 8.0+ first, then 7.0+, then 6.0+, etc.
  // Within each rating tier, prioritize titles available on the user's selected networks, followed by rating
  const items = isWatchlistMode
    ? filteredItems
    : [...filteredItems].sort((a, b) => {
        const tierA = getRatingTier(a.vote_average);
        const tierB = getRatingTier(b.vote_average);
        if (tierB !== tierA) {
          return tierB - tierA; // 8.0+ first, then 7.0+, then 6.0+
        }

        // Within the same rating tier, prioritize titles on user's selected networks
        if (subscribedServices.length > 0) {
          const aOn = isItemOnMyServices(a);
          const bOn = isItemOnMyServices(b);
          if (aOn && !bOn) return -1;
          if (!aOn && bOn) return 1;
        }

        // Within the same tier and network status, sort by vote_average descending
        return b.vote_average - a.vote_average;
      });

  const displayedItems = isWatchlistMode ? items : items.slice(0, visibleCount);

  const categories: { id: TmdbCategory; label: string; icon: any }[] = [
    { id: 'taste_match', label: 'Taste Match', icon: Sparkles },
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'popular_movies', label: 'Popular Movies', icon: Film },
    { id: 'popular_tv', label: 'Popular TV', icon: Tv },
    { id: 'top_rated', label: 'Top Rated', icon: Trophy },
    { id: 'now_playing', label: 'In Theaters', icon: Clapperboard },
    { id: 'international', label: 'International', icon: Globe },
  ];

  return (
    <section className="mb-12">
      {/* Sticky Frozen Filters Bar */}
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-16 z-30 bg-[#0A0B0D] pt-2 pb-3 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
        {/* Top Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          {/* Left Side: Genre Filter Button (replacing old switcher) in Popular, or Watchlist Title */}
          <div className="flex items-center gap-2">
            {isWatchlistMode ? (
              <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                <div className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 text-white" />
                  <h2 className="text-sm font-semibold tracking-wide text-white">
                    My Watchlist
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleShareList}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-[#F3F4F6] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ml-auto sm:ml-0 whitespace-nowrap shrink-0"
                  title="Create a unique shareable link for this Watchlist"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Share List</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setIsGenreModalOpen(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 ${
                    selectedGenres.length > 0
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-[#14161B] text-[#F3F4F6] border-white/[0.1] hover:bg-white/[0.05]'
                  }`}
                >
                  <Filter className={`w-3.5 h-3.5 shrink-0 ${selectedGenres.length > 0 ? 'text-black' : 'text-[#8E93A0]'}`} />
                  <span className="whitespace-nowrap">
                    {selectedGenres.length === 0 ? 'Genre' : `Genres (${selectedGenres.length})`}
                  </span>
                  <ChevronDown className={`w-3 h-3 shrink-0 ${selectedGenres.length > 0 ? 'text-black/60' : 'text-[#8E93A0]'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsDecadeModalOpen(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 ${
                    selectedDecades.length > 0
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-[#14161B] text-[#F3F4F6] border-white/[0.1] hover:bg-white/[0.05]'
                  }`}
                >
                  <Calendar className={`w-3.5 h-3.5 shrink-0 ${selectedDecades.length > 0 ? 'text-black' : 'text-[#8E93A0]'}`} />
                  <span className="whitespace-nowrap">
                    {selectedDecades.length === 0 ? 'Decades' : `Decades (${selectedDecades.length})`}
                  </span>
                  <ChevronDown className={`w-3 h-3 shrink-0 ${selectedDecades.length > 0 ? 'text-black/60' : 'text-[#8E93A0]'}`} />
                </button>

                {/* Streaming Now Toggle */}
                <button
                  type="button"
                  onClick={() => setFilter(filter === 'available' ? 'all' : 'available')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 ${
                    filter === 'available'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold shadow-sm'
                      : 'bg-[#14161B] text-[#8E93A0] border-white/[0.1] hover:bg-white/[0.05] hover:text-emerald-400'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Streaming Now</span>
                </button>

                {(selectedGenres.length > 0 || selectedDecades.length > 0 || filter === 'available') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGenres([]);
                      setSelectedDecades([]);
                      setFilter('all');
                    }}
                    className="px-2 py-1 rounded text-[11px] text-[#8E93A0] hover:text-white transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                    title="Clear filters"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Filter Pills & Services Trigger (Watchlist Mode) */}
          {isWatchlistMode && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {/* Replicated All, Movies, TV Shows Filter with Counts from Diary */}
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  filter === 'all'
                    ? 'bg-white text-black font-semibold border-white shadow-sm'
                    : 'bg-[#14161B] text-[#8E93A0] hover:text-white border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <span>All</span>
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                    filter === 'all' ? 'bg-black/10 text-black' : 'bg-white/[0.06] text-[#8E93A0]'
                  }`}
                >
                  {watchlistItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilter(filter === 'movies' ? 'all' : 'movies')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  filter === 'movies'
                    ? 'bg-white text-black font-semibold border-white shadow-sm'
                    : 'bg-[#14161B] text-[#8E93A0] hover:text-white border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <span>Movies</span>
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                    filter === 'movies' ? 'bg-black/10 text-black' : 'bg-white/[0.06] text-[#8E93A0]'
                  }`}
                >
                  {watchlistMovieCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilter(filter === 'tv' ? 'all' : 'tv')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  filter === 'tv'
                    ? 'bg-white text-black font-semibold border-white shadow-sm'
                    : 'bg-[#14161B] text-[#8E93A0] hover:text-white border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <span>TV Shows</span>
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                    filter === 'tv' ? 'bg-black/10 text-black' : 'bg-white/[0.06] text-[#8E93A0]'
                  }`}
                >
                  {watchlistTvCount}
                </span>
              </button>

              {/* Genre Filter in Watchlist Mode */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsGenreModalOpen(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 ${
                    selectedGenres.length > 0
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-[#14161B] text-[#F3F4F6] border-white/[0.1] hover:bg-white/[0.05]'
                  }`}
                >
                  <Filter className={`w-3.5 h-3.5 shrink-0 ${selectedGenres.length > 0 ? 'text-black' : 'text-[#8E93A0]'}`} />
                  <span className="whitespace-nowrap">
                    {selectedGenres.length === 0 ? 'Genre' : `Genres (${selectedGenres.length})`}
                  </span>
                  <ChevronDown className={`w-3 h-3 shrink-0 ${selectedGenres.length > 0 ? 'text-black/60' : 'text-[#8E93A0]'}`} />
                </button>

                {selectedGenres.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedGenres([])}
                    className="px-2 py-1 rounded text-[11px] text-[#8E93A0] hover:text-white transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                    title="Clear genre filters"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Decades Filter in Watchlist Mode */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDecadeModalOpen(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 ${
                    selectedDecades.length > 0
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-[#14161B] text-[#F3F4F6] border-white/[0.1] hover:bg-white/[0.05]'
                  }`}
                >
                  <Calendar className={`w-3.5 h-3.5 shrink-0 ${selectedDecades.length > 0 ? 'text-black' : 'text-[#8E93A0]'}`} />
                  <span className="whitespace-nowrap">
                    {selectedDecades.length === 0 ? 'Decades' : `Decades (${selectedDecades.length})`}
                  </span>
                  <ChevronDown className={`w-3 h-3 shrink-0 ${selectedDecades.length > 0 ? 'text-black/60' : 'text-[#8E93A0]'}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Filter Chips (Genres & Decades) */}
        {(selectedGenres.length > 0 || selectedDecades.length > 0) && (
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#636875] mr-0.5 shrink-0">
              Filters:
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedGenres([]);
                setSelectedDecades([]);
              }}
              className="text-xs text-[#8E93A0] hover:text-white transition-colors mr-1 cursor-pointer shrink-0"
            >
              Clear all
            </button>
            {selectedGenres.map((genre) => (
              <span
                key={genre}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/20 text-xs font-medium shrink-0 shadow-sm"
              >
                <span>{genre}</span>
                <button
                  type="button"
                  onClick={() => setSelectedGenres((prev) => prev.filter((g) => g !== genre))}
                  className="hover:text-rose-400 cursor-pointer p-0.5 rounded-full"
                  title={`Remove ${genre}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedDecades.map((decId) => {
              const label = DECADE_OPTIONS.find((d) => d.id === decId)?.label || decId;
              return (
                <span
                  key={decId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-medium shrink-0 shadow-sm"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDecades((prev) => prev.filter((d) => d !== decId))}
                    className="hover:text-rose-400 cursor-pointer p-0.5 rounded-full"
                    title={`Remove ${label}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* For You Live Feed Selector (When on Popular Mode) */}
        {!isWatchlistMode && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#636875] mr-1 shrink-0">
              For You:
            </span>
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => changeCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'bg-[#14161B] text-[#8E93A0] hover:text-white border border-white/[0.06]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-[#8E93A0]'}`} />
                  <span>{cat.label}</span>
                  {isSelected && isCatalogLoading && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black/70 animate-pulse ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid Content */}
      {isCatalogLoading && items.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-pulse">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-[2/3] w-full rounded-md bg-white/[0.04] border border-white/[0.06]" />
              <div className="h-3.5 w-3/4 bg-white/[0.05] rounded" />
              <div className="h-2.5 w-1/2 bg-white/[0.03] rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#14161B] border border-white/[0.08] max-w-lg mx-auto">
          <Bookmark className="w-8 h-8 text-[#8E93A0] mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-medium text-[#F3F4F6] mb-1">
            {filter === 'available'
              ? 'No titles matching your active subscriptions'
              : isWatchlistMode
              ? 'Your Watchlist is empty'
              : 'No matching titles found'}
          </h4>
          <p className="text-xs text-[#8E93A0] max-w-sm mx-auto mb-4 leading-relaxed">
            {filter === 'available'
              ? 'Try selecting more subscriptions or switch to browsing all titles.'
              : isWatchlistMode
              ? 'Browse titles in Popular or search above to save movies and TV shows you want to watch.'
              : 'Try clearing active filters or switching TMDb feeds.'}
          </p>
          {filter === 'available' ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="px-3.5 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-[#F3F4F6] transition-colors cursor-pointer shadow-sm"
              >
                Show All Titles
              </button>
              <button
                type="button"
                onClick={openServicesModal}
                className="px-3.5 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-white transition-colors cursor-pointer border border-white/10"
              >
                Manage Services
              </button>
            </div>
          ) : isWatchlistMode ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => triggerSearchFocus('watchlist')}
                className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-[#F3F4F6] transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add to List</span>
              </button>
              {onSwitchToPopular && (
                <button
                  type="button"
                  onClick={onSwitchToPopular}
                  className="px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-white transition-colors cursor-pointer"
                >
                  Explore Recs
                </button>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayedItems.map((item) => {
              const userTitle = getUserTitle(item.tmdb_id, item.media_type);
              const isWatching = userTitle?.status === 'watching';
              const isWatched = userTitle?.status === 'watched';
              const sources = item.streaming_sources || (item.primary_source ? [item.primary_source] : []);
              const matchingSubscribedSource =
                sources.find((s) => s !== 'Prime (Rent)' && s !== 'Prime Video (Rent)' && isServiceSubscribed(s)) ||
                sources.find((s) => isServiceSubscribed(s));
              const source = matchingSubscribedSource || item.primary_source || sources[0];
              const isSubscribed = matchingSubscribedSource ? true : (source ? isServiceSubscribed(source) : false);

              return (
                <div
                  key={`${item.media_type}-${item.tmdb_id}`}
                  className="group flex flex-col cursor-pointer transition-transform duration-150 active:scale-[0.98]"
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
                          source === 'In Theaters'
                            ? 'bg-amber-950/90 text-amber-300 border border-amber-500/50'
                            : source === 'Coming Soon'
                            ? 'bg-purple-950/90 text-purple-300 border border-purple-500/50'
                            : isSubscribed
                            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                            : 'bg-black/85 text-[#F3F4F6] border border-white/10'
                        }`}
                      >
                        {source === 'In Theaters' ? (
                          <Clapperboard className="w-2.5 h-2.5 stroke-[2.5] text-amber-400" />
                        ) : source === 'Coming Soon' ? (
                          <Sparkles className="w-2.5 h-2.5 stroke-[2.5] text-purple-400" />
                        ) : isSubscribed ? (
                          <Check className="w-2.5 h-2.5 stroke-[3] text-emerald-400" />
                        ) : null}
                        <span>{source}</span>
                      </div>
                    )}

                    {/* Status Indicator Chip (Top Right) */}
                    {userTitle && (isWatching || isWatched) && (
                      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-white text-black text-[9px] font-bold uppercase tracking-wider shadow-sm z-20">
                        {isWatching ? 'Watching' : 'Watched'}
                      </div>
                    )}

                    {/* Quick-action overlay button on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 z-20">
                      <span className="px-2.5 py-1 rounded bg-[#F4F4F6] text-[#0A0B0D] text-[11px] font-medium shadow-md">
                        Details
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
                </div>
              );
            })}
          </div>

          {/* Silent background pagination sentinel */}
          {!isWatchlistMode && (
            <div ref={sentinelRef} className="h-10 w-full pointer-events-none opacity-0" />
          )}
        </>
      )}

      {/* Genre Filter Modal */}
      <GenreFilterModal
        isOpen={isGenreModalOpen}
        onClose={() => setIsGenreModalOpen(false)}
        selectedGenres={selectedGenres}
        onToggleGenre={(genre) => {
          setSelectedGenres((prev) =>
            prev.includes(genre)
              ? prev.filter((g) => g !== genre)
              : [...prev, genre]
          );
        }}
        onClearGenres={() => setSelectedGenres([])}
      />

      {/* Decade Filter Modal */}
      <DecadeFilterModal
        isOpen={isDecadeModalOpen}
        onClose={() => setIsDecadeModalOpen(false)}
        selectedDecades={selectedDecades}
        onToggleDecade={(decId) => {
          setSelectedDecades((prev) =>
            prev.includes(decId)
              ? prev.filter((d) => d !== decId)
              : [...prev, decId]
          );
        }}
        onClearDecades={() => setSelectedDecades([])}
      />
    </section>
  );
}
