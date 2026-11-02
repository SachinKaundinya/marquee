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
import { getServiceUrl } from '@/components/CinematicDetailModal';
import { toast } from 'sonner';

type FormatFilterType = 'all' | 'movies' | 'tv';

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
  const isWatchlistMode = mode === 'watchlist';

  const {
    catalog,
    userTitles,
    openQuickLog,
    openDetailModal,
    openTonightsPick,
    getUserTitle,
    updateStatus,
    removeTitle,
    isItemOnMyServices,
    isServiceSubscribed,
    openServicesModal,
    subscribedServices,
    selectedCategory,
    changeCategory,
    loadMoreCatalog,
    isCatalogLoading,
    triggerSearchFocus,
    selectedGenres: contextGenres,
    setSelectedGenres: setContextGenres,
    selectedDecades: contextDecades,
    setSelectedDecades: setContextDecades,
  } = useMedia();

  const [formatFilter, setFormatFilter] = useState<FormatFilterType>('all');
  const [onlyStreamingNow, setOnlyStreamingNow] = useState(false);
  const [watchlistGenres, setWatchlistGenres] = useState<string[]>([]);
  const [watchlistDecades, setWatchlistDecades] = useState<string[]>([]);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [isDecadeModalOpen, setIsDecadeModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [glowingKeys, setGlowingKeys] = useState<Set<string>>(new Set());
  const [sessionAddedKeys, setSessionAddedKeys] = useState<Set<string>>(new Set());

  const selectedGenres = isWatchlistMode ? watchlistGenres : contextGenres;
  const setSelectedGenres = isWatchlistMode ? setWatchlistGenres : setContextGenres;
  const selectedDecades = isWatchlistMode ? watchlistDecades : contextDecades;
  const setSelectedDecades = isWatchlistMode ? setWatchlistDecades : setContextDecades;

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

  // In Popular mode, exclude tracked titles but preserve titles added in current session so user sees the green confirmation
  const baseItems = isWatchlistMode
    ? watchlistItems
    : catalog.filter((item) => {
        const key = `${item.media_type}-${item.tmdb_id}`;
        if (sessionAddedKeys.has(key)) return true;
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

  const recsMovieCount = React.useMemo(
    () => baseItems.filter((i) => i.media_type === 'movie').length,
    [baseItems]
  );
  const recsTvCount = React.useMemo(
    () => baseItems.filter((i) => i.media_type === 'tv').length,
    [baseItems]
  );

  const totalCount = isWatchlistMode ? watchlistItems.length : baseItems.length;
  const movieCount = isWatchlistMode ? watchlistMovieCount : recsMovieCount;
  const tvCount = isWatchlistMode ? watchlistTvCount : recsTvCount;

  // Filter items based on format filter, streaming filter, and genre/decade multi-select
  const filteredItems = baseItems
    .filter((item) => {
      if (onlyStreamingNow && !isItemOnMyServices(item)) return false;
      if (formatFilter === 'movies' && item.media_type !== 'movie') return false;
      if (formatFilter === 'tv' && item.media_type !== 'tv') return false;
      return true;
    })
    .filter((item) => matchesGenres(item.genres, selectedGenres, item.overview || ''))
    .filter((item) => matchesDecades(item.release_year, selectedDecades));

  const [visibleCount, setVisibleCount] = useState(30);

  // Reset visibleCount when switching category, tab mode, or filters for instant responsiveness & low memory
  React.useEffect(() => {
    setVisibleCount(30);
  }, [selectedCategory, formatFilter, onlyStreamingNow, selectedGenres, selectedDecades, mode]);

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const isLoadingRef = React.useRef(isCatalogLoading);
  const isPaginatingRef = React.useRef(false);
  const lastPaginationTimeRef = React.useRef(0);

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
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisibleCount((prev) => prev + 24);

          const now = Date.now();
          if (now - lastPaginationTimeRef.current < 800) return;
          if (isLoadingRef.current || isPaginatingRef.current) return;

          lastPaginationTimeRef.current = now;
          isPaginatingRef.current = true;
          loadMoreCatalog().finally(() => {
            setTimeout(() => {
              isPaginatingRef.current = false;
            }, 300);
          });
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isWatchlistMode, loadMoreCatalog]);

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

  const spotlightItem = !isWatchlistMode && items.length > 0 ? items[0] : null;
  const displayedItems = isWatchlistMode
    ? items.slice(0, visibleCount)
    : spotlightItem
    ? items.slice(1, visibleCount)
    : items.slice(0, visibleCount);

  const categories: { id: TmdbCategory; label: string; icon: any }[] = [
    { id: 'taste_match', label: 'Taste Match', icon: Sparkles },
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'top_rated', label: 'Top Rated', icon: Trophy },
    { id: 'now_playing', label: 'In Theaters', icon: Clapperboard },
    { id: 'popular_movies', label: 'Popular Movies', icon: Film },
    { id: 'popular_tv', label: 'Popular TV', icon: Tv },
    { id: 'international', label: 'International', icon: Globe },
  ];

  // Spotlight metadata calculation
  const spotlightUserTitle = spotlightItem ? getUserTitle(spotlightItem.tmdb_id, spotlightItem.media_type) : null;
  const isSpotlightInWatchlist = spotlightUserTitle?.status === 'want_to_watch';
  const spotlightSources = spotlightItem
    ? spotlightItem.streaming_sources || (spotlightItem.primary_source ? [spotlightItem.primary_source] : [])
    : [];
  const matchingSpotlightSubscribed = spotlightSources.find(
    (s) => s !== 'Prime (Rent)' && s !== 'Prime Video (Rent)' && isServiceSubscribed(s)
  ) || spotlightSources.find((s) => isServiceSubscribed(s));
  const spotlightSource = matchingSpotlightSubscribed || spotlightItem?.primary_source || spotlightSources[0];
  const isSpotlightSubscribed = matchingSpotlightSubscribed ? true : spotlightSource ? isServiceSubscribed(spotlightSource) : false;
  const spotlightWatchUrl = spotlightSource && spotlightSource !== 'Coming Soon' && spotlightItem
    ? getServiceUrl(spotlightSource, spotlightItem.title)
    : null;
  const spotlightBackdropUrl = spotlightItem
    ? spotlightItem.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${spotlightItem.backdrop_path}`
      : spotlightItem.poster_path
      ? `https://image.tmdb.org/t/p/w780${spotlightItem.poster_path}`
      : null
    : null;

  return (
    <section className="mb-12">
      {/* Sticky Frozen Filters Bar */}
      <div
        className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-16 z-30 bg-[#0A0B0D] pt-2 pb-3 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        style={{ WebkitBackdropFilter: 'none', backdropFilter: 'none' }}
      >
        {/* Row 1: Watchlist Header OR Recs Category Horizontal Bar */}
        {isWatchlistMode ? (
          <div className="flex items-center justify-between w-full gap-3 mb-2.5">
            <div className="flex items-center gap-2.5">
              <Bookmark className="w-4 h-4 text-white" />
              <h2 className="text-sm font-semibold tracking-wide text-white">
                My Watchlist
              </h2>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={openTonightsPick}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#E5A93C]/15 border border-[#E5A93C]/35 text-[#E5A93C] hover:bg-[#E5A93C]/25 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap shrink-0"
                title="Spin Tonight's Pick from your Watchlist"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Tonight&apos;s Pick</span>
              </button>

              <button
                type="button"
                onClick={handleShareList}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-[#F3F4F6] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap shrink-0"
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
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => changeCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'bg-[#14161B] text-[#8E93A0] hover:text-white border border-white/[0.06] hover:bg-white/[0.04]'
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

        {/* Row 2: Format Filter Segmented Controls + Streaming Now + Genre + Decades (Identical in both Recs & Watchlist) */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Format pills: All, Movies, TV Shows */}
            <button
              type="button"
              onClick={() => setFormatFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                formatFilter === 'all'
                  ? 'bg-white text-black font-semibold border-white shadow-sm'
                  : 'bg-[#14161B] text-[#8E93A0] hover:text-white border-white/[0.06] hover:bg-white/[0.04]'
              }`}
            >
              <span>All</span>
              <span
                className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                  formatFilter === 'all' ? 'bg-black/10 text-black' : 'bg-white/[0.06] text-[#8E93A0]'
                }`}
              >
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFormatFilter(formatFilter === 'movies' ? 'all' : 'movies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                formatFilter === 'movies'
                  ? 'bg-white text-black font-semibold border-white shadow-sm'
                  : 'bg-[#14161B] text-[#8E93A0] hover:text-white border-white/[0.06] hover:bg-white/[0.04]'
              }`}
            >
              <span>Movies</span>
              <span
                className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                  formatFilter === 'movies' ? 'bg-black/10 text-black' : 'bg-white/[0.06] text-[#8E93A0]'
                }`}
              >
                {movieCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFormatFilter(formatFilter === 'tv' ? 'all' : 'tv')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                formatFilter === 'tv'
                  ? 'bg-white text-black font-semibold border-white shadow-sm'
                  : 'bg-[#14161B] text-[#8E93A0] hover:text-white border-white/[0.06] hover:bg-white/[0.04]'
              }`}
            >
              <span>TV Shows</span>
              <span
                className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                  formatFilter === 'tv' ? 'bg-black/10 text-black' : 'bg-white/[0.06] text-[#8E93A0]'
                }`}
              >
                {tvCount}
              </span>
            </button>

            {/* Streaming Now Toggle */}
            <button
              type="button"
              onClick={() => setOnlyStreamingNow(!onlyStreamingNow)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 ${
                onlyStreamingNow
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                  : 'bg-[#14161B] text-[#8E93A0] border-white/[0.06] hover:bg-white/[0.04] hover:text-emerald-400'
              }`}
            >
              <Check className={`w-3.5 h-3.5 stroke-[2.5] ${onlyStreamingNow ? 'text-emerald-400' : 'text-[#8E93A0]'}`} />
              <span>Streaming Now</span>
            </button>

            {/* Genre Filter */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsGenreModalOpen(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 ${
                  selectedGenres.length > 0
                    ? 'bg-white text-black border-white font-semibold'
                    : 'bg-[#14161B] text-[#F3F4F6] border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <Filter className={`w-3.5 h-3.5 shrink-0 ${selectedGenres.length > 0 ? 'text-black' : 'text-[#8E93A0]'}`} />
                <span className="whitespace-nowrap">
                  {selectedGenres.length === 0 ? 'Genre' : `Genres (${selectedGenres.length})`}
                </span>
                <ChevronDown className={`w-3 h-3 shrink-0 ${selectedGenres.length > 0 ? 'text-black/60' : 'text-[#8E93A0]'}`} />
              </button>
            </div>

            {/* Decades Filter */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsDecadeModalOpen(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 ${
                  selectedDecades.length > 0
                    ? 'bg-white text-black border-white font-semibold'
                    : 'bg-[#14161B] text-[#F3F4F6] border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 shrink-0 ${selectedDecades.length > 0 ? 'text-black' : 'text-[#8E93A0]'}`} />
                <span className="whitespace-nowrap">
                  {selectedDecades.length === 0 ? 'Decades' : `Decades (${selectedDecades.length})`}
                </span>
                <ChevronDown className={`w-3 h-3 shrink-0 ${selectedDecades.length > 0 ? 'text-black/60' : 'text-[#8E93A0]'}`} />
              </button>
            </div>

            {/* Reset button if any filter is active */}
            {(selectedGenres.length > 0 || selectedDecades.length > 0 || onlyStreamingNow || formatFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGenres([]);
                  setSelectedDecades([]);
                  setOnlyStreamingNow(false);
                  setFormatFilter('all');
                }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] text-[#8E93A0] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                title="Reset filters"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 3: Active Filter Chips */}
        {(selectedGenres.length > 0 || selectedDecades.length > 0) && (
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
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
            {onlyStreamingNow
              ? 'No titles matching your active subscriptions'
              : isWatchlistMode
              ? 'Your Watchlist is empty'
              : 'No matching titles found'}
          </h4>
          <p className="text-xs text-[#8E93A0] max-w-sm mx-auto mb-4 leading-relaxed">
            {onlyStreamingNow
              ? 'Try selecting more subscriptions or turn off "Streaming Now" to browse all titles.'
              : isWatchlistMode
              ? 'Browse titles in Popular or search above to save movies and TV shows you want to watch.'
              : 'Try clearing active filters or switching categories.'}
          </p>
          {onlyStreamingNow ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyStreamingNow(false)}
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
          {/* 2D: Spotlight Hero Card at the top of Recs feed */}
          {spotlightItem && (
            <div
              onClick={() => openDetailModal(spotlightItem)}
              className="group relative w-full rounded-2xl overflow-hidden mb-8 border border-white/10 bg-[#14161B] shadow-[0_12px_40px_rgba(0,0,0,0.6)] cursor-pointer transition-all duration-300 hover:border-white/20 active:scale-[0.99]"
            >
              {/* Background Backdrop Image */}
              <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
                {spotlightBackdropUrl ? (
                  <img
                    src={spotlightBackdropUrl}
                    alt={spotlightItem.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#181A20] to-[#0D0E12]" />
                )}

                {/* Dark Vignette Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-[#0A0B0D]/75 sm:via-[#0A0B0D]/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0D]/95 via-[#0A0B0D]/70 sm:via-[#0A0B0D]/30 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 z-10">
                  <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>Spotlight</span>
                  </span>
                  {spotlightSource && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold backdrop-blur-md flex items-center gap-1 shadow-sm ${
                        spotlightSource === 'In Theaters'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                          : isSpotlightSubscribed
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : 'bg-black/70 text-[#F3F4F6] border border-white/10'
                      }`}
                    >
                      {isSpotlightSubscribed && <Check className="w-3 h-3 stroke-[3] text-emerald-400" />}
                      <span>{spotlightSource}</span>
                    </span>
                  )}
                </div>

                {/* Hero Bottom Content */}
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 md:p-8 flex flex-col justify-end z-10">
                  {/* Metadata Row */}
                  <div className="flex items-center gap-2 text-xs text-[#8E93A0] mb-1.5 flex-wrap">
                    <div className="flex items-center gap-1 font-semibold tabular-nums">
                      <span className="px-1 py-0.2 rounded text-[9px] font-black uppercase tracking-tight bg-[#F5C518] text-black leading-none font-sans shadow-sm">
                        IMDb
                      </span>
                      <span className="text-white font-bold text-xs sm:text-sm">
                        {(typeof spotlightItem.vote_average === 'number' ? spotlightItem.vote_average : 0).toFixed(1)}
                      </span>
                    </div>
                    <span>•</span>
                    <span>{spotlightItem.genres?.[0] || (spotlightItem.media_type === 'movie' ? 'Movie' : 'TV Series')}</span>
                    <span>•</span>
                    <span>{spotlightItem.release_year}</span>
                    {spotlightItem.runtime && spotlightItem.runtime > 0 ? (
                      <>
                        <span>•</span>
                        <span>{Math.floor(spotlightItem.runtime / 60)}h {spotlightItem.runtime % 60}m</span>
                      </>
                    ) : null}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight line-clamp-1 group-hover:text-amber-200 transition-colors">
                    {spotlightItem.title}
                  </h3>

                  {/* Overview */}
                  {spotlightItem.overview && (
                    <p className="mt-1 text-xs sm:text-sm text-[#A0A5B2] line-clamp-2 max-w-2xl leading-relaxed">
                      {spotlightItem.overview}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 mt-3 sm:mt-4 pt-1">
                    {spotlightWatchUrl ? (
                      <a
                        href={spotlightWatchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                      >
                        <span>Watch on {spotlightSource}</span>
                        <Share2 className="w-3.5 h-3.5 rotate-45 stroke-[2.5]" />
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!spotlightItem) return;
                        const sKey = `${spotlightItem.media_type}-${spotlightItem.tmdb_id}`;
                        const isSpotlightGlowing = glowingKeys.has(sKey);
                        const isSpotlightSaved = isSpotlightInWatchlist || isSpotlightGlowing;

                        if (isSpotlightSaved) {
                          removeTitle(spotlightItem.tmdb_id, spotlightItem.media_type, { silent: true });
                          setSessionAddedKeys((prev) => {
                            const next = new Set(prev);
                            next.delete(sKey);
                            return next;
                          });
                          setGlowingKeys((prev) => {
                            const next = new Set(prev);
                            next.delete(sKey);
                            return next;
                          });
                        } else {
                          setGlowingKeys((prev) => new Set(prev).add(sKey));
                          setSessionAddedKeys((prev) => new Set(prev).add(sKey));
                          updateStatus(spotlightItem.tmdb_id, spotlightItem.media_type, 'want_to_watch', spotlightItem, { silent: true });
                          setTimeout(() => {
                            setGlowingKeys((prev) => {
                              const next = new Set(prev);
                              next.delete(sKey);
                              return next;
                            });
                          }, 1200);
                        }
                      }}
                      className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 backdrop-blur-md active:scale-95 cursor-pointer ${
                        spotlightItem && glowingKeys.has(`${spotlightItem.media_type}-${spotlightItem.tmdb_id}`)
                          ? 'bg-emerald-400 text-black shadow-[0_0_20px_rgba(52,211,153,1)] ring-2 ring-emerald-300 scale-105'
                          : isSpotlightInWatchlist || (spotlightItem && glowingKeys.has(`${spotlightItem.media_type}-${spotlightItem.tmdb_id}`))
                          ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      }`}
                    >
                      {spotlightItem && glowingKeys.has(`${spotlightItem.media_type}-${spotlightItem.tmdb_id}`) ? (
                        <Check className="w-3.5 h-3.5 stroke-[3] text-black" />
                      ) : (
                        <Bookmark className={`w-3.5 h-3.5 ${isSpotlightInWatchlist ? 'fill-black' : ''}`} />
                      )}
                      <span>{isSpotlightInWatchlist || (spotlightItem && glowingKeys.has(`${spotlightItem.media_type}-${spotlightItem.tmdb_id}`)) ? 'In Watchlist' : 'Watchlist'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailModal(spotlightItem);
                      }}
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-black/40 hover:bg-black/60 text-[#D1D5DB] hover:text-white border border-white/10 transition-all backdrop-blur-md"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayedItems.map((item) => {
              const userTitle = getUserTitle(item.tmdb_id, item.media_type);
              const isWatching = userTitle?.status === 'watching';
              const isWatched = userTitle?.status === 'watched';
              const isWatchlist = userTitle?.status === 'want_to_watch';
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
                  onClick={() => openDetailModal(item)}
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

                    {/* 1A: One-Tap Quick Action Button (Top Right) */}
                    {(() => {
                      const itemKey = `${item.media_type}-${item.tmdb_id}`;
                      const isItemGlowing = glowingKeys.has(itemKey);
                      const isItemSaved = isWatchlist || isItemGlowing;

                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isItemSaved) {
                              removeTitle(item.tmdb_id, item.media_type, { silent: true });
                              setSessionAddedKeys((prev) => {
                                const next = new Set(prev);
                                next.delete(itemKey);
                                return next;
                              });
                              setGlowingKeys((prev) => {
                                const next = new Set(prev);
                                next.delete(itemKey);
                                return next;
                              });
                            } else {
                              setGlowingKeys((prev) => new Set(prev).add(itemKey));
                              setSessionAddedKeys((prev) => new Set(prev).add(itemKey));
                              updateStatus(item.tmdb_id, item.media_type, 'want_to_watch', item, { silent: true });
                              setTimeout(() => {
                                setGlowingKeys((prev) => {
                                  const next = new Set(prev);
                                  next.delete(itemKey);
                                  return next;
                                });
                              }, 1200);
                            }
                          }}
                          className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 z-20 shadow-md cursor-pointer ${
                            isItemGlowing
                              ? 'bg-emerald-400 text-black ring-4 ring-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,1)] scale-125'
                              : isItemSaved
                              ? 'bg-emerald-500 text-black ring-2 ring-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                              : isWatched
                              ? 'bg-emerald-600 text-black'
                              : isWatching
                              ? 'bg-sky-500 text-white'
                              : 'bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/20 hover:scale-110 active:scale-95'
                          }`}
                          title={
                            isItemSaved
                              ? 'Remove from Watchlist'
                              : isWatched
                              ? 'Watched'
                              : isWatching
                              ? 'Watching'
                              : 'Quick Add to Watchlist'
                          }
                        >
                          {isItemGlowing ? (
                            <Check className="w-4 h-4 stroke-[3.5] text-black" />
                          ) : isItemSaved ? (
                            <Bookmark className="w-3.5 h-3.5 fill-current stroke-current" />
                          ) : isWatched ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : isWatching ? (
                            <Film className="w-3.5 h-3.5" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                        </button>
                      );
                    })()}

                    {/* Quick-action overlay button on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 z-10 pointer-events-none">
                      <span className="px-2.5 py-1 rounded bg-[#F4F4F6] text-[#0A0B0D] text-[11px] font-medium shadow-md">
                        Details
                      </span>
                    </div>
                  </div>

                  {/* 2F: Sub-text beneath poster with strict single-line micro-details */}
                  <div className="mt-2 flex flex-col">
                    <h4 className="text-xs font-medium text-[#F3F4F6] truncate tracking-tight group-hover:text-white transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-[#8E93A0] gap-1.5 min-w-0">
                      <span className="truncate whitespace-nowrap min-w-0 flex-1 text-[11px] text-[#8E93A0]">
                        {(item.genres && item.genres[0]) || (item.media_type === 'movie' ? 'Movie' : 'Series')} • {item.release_year}
                      </span>
                      <div className="flex items-center gap-1 font-semibold tabular-nums text-[11px] shrink-0">
                        <span
                          className={`px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-tight leading-none font-sans shadow-sm ${
                            item.rating_source === 'tmdb'
                              ? 'bg-sky-950/80 text-sky-300 border border-sky-500/30'
                              : 'bg-[#F5C518] text-black'
                          }`}
                        >
                          {item.rating_source === 'tmdb' ? 'TMDb' : 'IMDb'}
                        </span>
                        <span className="text-[#F3F4F6]">
                          {(typeof item.vote_average === 'number' ? item.vote_average : 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subtle loading spinner when fetching subsequent pages */}
          {!isWatchlistMode && isCatalogLoading && items.length > 0 && (
            <div className="flex justify-center items-center py-6">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#14161B] border border-white/[0.08] text-xs text-[#8E93A0] shadow-sm">
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Loading more titles...</span>
              </div>
            </div>
          )}

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
