'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Dice5,
  Play,
  Film,
  ExternalLink,
  Bookmark,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useMedia } from '@/context/MediaContext';
import { MediaItem } from '@/types/media';
import { getServiceUrl } from '@/components/CinematicDetailModal';
import { fetchTonightsPickPool } from '@/lib/tmdb';

type PoolSource = 'watchlist' | 'catalog';
type FormatType = 'any' | 'movie' | 'tv';
type VibeType = 'any' | 'mind_bender' | 'adrenaline' | 'comedy' | 'dark' | 'chills' | 'acclaimed' | 'true_crime';

interface VibeOption {
  id: VibeType;
  label: string;
  emoji: string;
  description: string;
}

const VIBE_OPTIONS: VibeOption[] = [
  { id: 'any', label: 'Surprise Me', emoji: '✨', description: 'Any mood or genre' },
  { id: 'mind_bender', label: 'Mind-Bender', emoji: '🌀', description: 'Sci-Fi & Mystery' },
  { id: 'adrenaline', label: 'Pure Adrenaline', emoji: '⚡', description: 'Action & Crime' },
  { id: 'comedy', label: 'Laugh & Unwind', emoji: '🍿', description: 'Feel-good & Comedy' },
  { id: 'dark', label: 'Dark & Gripping', emoji: '🍷', description: 'Prestige Drama & Noir' },
  { id: 'chills', label: 'Spine-Chilling', emoji: '🕯️', description: 'Horror & Psychological' },
  { id: 'true_crime', label: 'True Crime', emoji: '🔍', description: 'Real cases & mysteries' },
  { id: 'acclaimed', label: 'Top Shelf (8.0+)', emoji: '🏆', description: 'Universally acclaimed' },
];

export function TonightsPickView() {
  const {
    watchlistTitles,
    userTitles,
    catalog,
    isItemOnMyServices,
    openDetailModal,
    updateStatus,
  } = useMedia();

  const [poolSource, setPoolSource] = useState<PoolSource>(
    watchlistTitles.length > 0 ? 'watchlist' : 'catalog'
  );
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('movie');
  const [selectedLength, setSelectedLength] = useState<string>('any');
  const [selectedVibe, setSelectedVibe] = useState<VibeType>('any');
  const [onlySubscribed, setOnlySubscribed] = useState(true);
  const [actionedIds, setActionedIds] = useState<Set<number>>(new Set());

  // Dynamic discovery pool for "Curated by Mirar"
  const [curatedPool, setCuratedPool] = useState<MediaItem[]>([]);
  const [isPoolLoading, setIsPoolLoading] = useState(false);

  useEffect(() => {
    if (poolSource !== 'catalog') return;
    let isCancelled = false;
    setIsPoolLoading(true);

    fetchTonightsPickPool(selectedFormat, selectedVibe, selectedLength)
      .then((items) => {
        if (!isCancelled && items && items.length > 0) {
          setCuratedPool(items);
        }
      })
      .catch((err) => {
        console.error("Failed to load Tonight's Pick pool", err);
      })
      .finally(() => {
        if (!isCancelled) setIsPoolLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [poolSource, selectedFormat, selectedVibe, selectedLength]);

  // Shuffling / Result State
  const [isSpinning, setIsSpinning] = useState(false);
  const [pickedItem, setPickedItem] = useState<MediaItem | null>(null);
  const [showThreePicks, setShowThreePicks] = useState(false);
  const [threePicks, setThreePicks] = useState<MediaItem[]>([]);

  const resultsRef = useRef<HTMLDivElement>(null);

  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  // Filter pool candidates
  const eligibleItems = useMemo(() => {
    const rawList: MediaItem[] =
      poolSource === 'watchlist'
        ? (watchlistTitles.map((t) => t.media).filter(Boolean) as MediaItem[])
        : curatedPool.length > 0
        ? curatedPool
        : catalog;

    // Track watched/actioned items to exclude from recommendation
    const excludedIds = new Set<number>(actionedIds);
    for (const ut of userTitles) {
      if (ut.status === 'watched') {
        excludedIds.add(ut.tmdb_id);
      } else if (poolSource === 'catalog' && (ut.status === 'want_to_watch' || ut.status === 'watching')) {
        excludedIds.add(ut.tmdb_id);
      }
    }

    return rawList.filter((item) => {
      // Exclude already actioned or watched items
      if (excludedIds.has(item.tmdb_id)) {
        return false;
      }

      // 1. Streaming subscription check
      if (onlySubscribed && !isItemOnMyServices(item)) {
        return false;
      }

      // 2. Format check
      if (selectedFormat === 'movie' && item.media_type !== 'movie') return false;
      if (selectedFormat === 'tv' && item.media_type !== 'tv') return false;

      // 3. Length check
      if (selectedLength !== 'any') {
        const runtime = item.runtime;

        if (selectedFormat === 'movie' || item.media_type === 'movie') {
          if (typeof runtime === 'number' && runtime > 0) {
            if (selectedLength === 'short' && runtime >= 100) return false;
            if (selectedLength === 'standard' && (runtime < 100 || runtime > 140)) return false;
            if (selectedLength === 'epic' && runtime <= 140) return false;
          }
        } else if (selectedFormat === 'tv' || item.media_type === 'tv') {
          if (typeof runtime === 'number' && runtime > 0) {
            if (selectedLength === 'tv_short' && runtime >= 35) return false;
            if (selectedLength === 'tv_standard' && (runtime < 30 || runtime > 55)) return false;
            if (selectedLength === 'tv_long' && runtime <= 45) return false;
          } else {
            const isComedyOrAnim = (item.genres || []).some(
              (g) => g.toLowerCase().includes('comedy') || g.toLowerCase().includes('animation')
            );
            if (selectedLength === 'tv_short' && !isComedyOrAnim) return false;
            if (selectedLength === 'tv_long' && isComedyOrAnim) return false;
          }
        } else {
          if (typeof runtime === 'number' && runtime > 0) {
            if (selectedLength === 'any_short' && runtime >= 45) return false;
            if (selectedLength === 'any_med' && (runtime < 40 || runtime > 90)) return false;
            if (selectedLength === 'any_long' && (runtime < 90 || runtime > 130)) return false;
            if (selectedLength === 'any_epic' && runtime <= 130) return false;
          }
        }
      }

      // 4. Vibe check
      const genres = (item.genres || []).map((g) => g.toLowerCase());
      const overview = (item.overview || '').toLowerCase();

      if (selectedVibe === 'mind_bender') {
        const matches =
          genres.some((g) => g.includes('sci') || g.includes('mystery') || g.includes('thriller')) ||
          overview.includes('reality') || overview.includes('memory') || overview.includes('time');
        if (!matches) return false;
      } else if (selectedVibe === 'adrenaline') {
        const matches = genres.some((g) => g.includes('action') || g.includes('crime') || g.includes('adventure'));
        if (!matches) return false;
      } else if (selectedVibe === 'comedy') {
        const matches = genres.some((g) => g.includes('comedy') || g.includes('animation'));
        if (!matches) return false;
      } else if (selectedVibe === 'dark') {
        const matches = genres.some((g) => g.includes('drama') || g.includes('crime') || g.includes('noir'));
        if (!matches) return false;
      } else if (selectedVibe === 'chills') {
        const matches = genres.some((g) => g.includes('horror') || g.includes('supernatural'));
        if (!matches) return false;
      } else if (selectedVibe === 'true_crime') {
        const matches =
          genres.some((g) => g.includes('crime') || g.includes('doc') || g.includes('biography') || g.includes('history')) ||
          overview.includes('murder') ||
          overview.includes('serial killer') ||
          overview.includes('investigation') ||
          overview.includes('true story') ||
          overview.includes('real-life') ||
          overview.includes('fbi') ||
          overview.includes('police') ||
          overview.includes('detective');
        if (!matches) return false;
      } else if (selectedVibe === 'acclaimed') {
        if (item.vote_average < 7.9) return false;
      }

      return true;
    });
  }, [poolSource, watchlistTitles, catalog, curatedPool, actionedIds, userTitles, onlySubscribed, selectedFormat, selectedLength, selectedVibe, isItemOnMyServices]);

  // Synchronize picks if any displayed title gets tracked (e.g. from Details modal)
  useEffect(() => {
    if (showThreePicks && threePicks.length > 0) {
      const trackedTmdbIds = new Set(
        userTitles
          .filter(
            (ut) =>
              ut.status === 'watched' ||
              (poolSource === 'catalog' && (ut.status === 'want_to_watch' || ut.status === 'watching'))
          )
          .map((ut) => ut.tmdb_id)
      );

      const needsReplacement = threePicks.some((p) => trackedTmdbIds.has(p.tmdb_id));
      if (needsReplacement) {
        setThreePicks((prev) => {
          const visibleIds = new Set(prev.map((p) => p.tmdb_id));
          return prev
            .map((item) => {
              if (!trackedTmdbIds.has(item.tmdb_id)) return item;
              const candidates = eligibleItems.filter(
                (cand) => !visibleIds.has(cand.tmdb_id) && !trackedTmdbIds.has(cand.tmdb_id)
              );
              if (candidates.length > 0) {
                const replacement = candidates[Math.floor(Math.random() * candidates.length)];
                visibleIds.add(replacement.tmdb_id);
                return replacement;
              }
              return item;
            })
            .filter((item) => !trackedTmdbIds.has(item.tmdb_id));
        });
      }
    } else if (pickedItem) {
      const isTracked = userTitles.some(
        (ut) =>
          ut.tmdb_id === pickedItem.tmdb_id &&
          (ut.status === 'watched' || (poolSource === 'catalog' && ut.status === 'want_to_watch'))
      );
      if (isTracked) {
        const candidates = eligibleItems.filter((i) => i.tmdb_id !== pickedItem.tmdb_id);
        if (candidates.length > 0) {
          setPickedItem(candidates[Math.floor(Math.random() * candidates.length)]);
        } else {
          setPickedItem(null);
        }
      }
    }
  }, [userTitles, poolSource, eligibleItems, showThreePicks, threePicks, pickedItem]);

  const handleRoll = () => {
    if (eligibleItems.length === 0) return;
    setIsSpinning(true);
    setShowThreePicks(false);

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * eligibleItems.length);
      setPickedItem(eligibleItems[randomIndex]);
      setIsSpinning(false);
      scrollToResults();
    }, 380);
  };

  const handlePickThree = () => {
    if (eligibleItems.length === 0) return;
    setIsSpinning(true);
    setTimeout(() => {
      const shuffled = [...eligibleItems].sort(() => 0.5 - Math.random());
      setThreePicks(shuffled.slice(0, 3));
      setShowThreePicks(true);
      setPickedItem(null);
      setIsSpinning(false);
      scrollToResults();
    }, 380);
  };

  const handleActionAndReroll = (targetItem: MediaItem, status: 'watched' | 'want_to_watch') => {
    updateStatus(targetItem.tmdb_id, targetItem.media_type, status, targetItem, { silent: true });

    setActionedIds((prev) => {
      const next = new Set(prev);
      next.add(targetItem.tmdb_id);
      return next;
    });

    if (showThreePicks) {
      const currentIds = new Set(threePicks.map((p) => p.tmdb_id));
      currentIds.add(targetItem.tmdb_id);

      const remainingCandidates = eligibleItems.filter((i) => !currentIds.has(i.tmdb_id));
      const replacement =
        remainingCandidates.length > 0
          ? remainingCandidates[Math.floor(Math.random() * remainingCandidates.length)]
          : null;

      if (replacement) {
        setThreePicks((prev) =>
          prev.map((item) => (item.tmdb_id === targetItem.tmdb_id ? replacement : item))
        );
      } else {
        setThreePicks((prev) => prev.filter((item) => item.tmdb_id !== targetItem.tmdb_id));
      }
    } else {
      const remaining = eligibleItems.filter((i) => i.tmdb_id !== targetItem.tmdb_id);
      if (remaining.length > 0) {
        const next = remaining[Math.floor(Math.random() * remaining.length)];
        setPickedItem(next);
      } else {
        setPickedItem(null);
      }
    }
  };

  // Reusable Movie Card matching Details layout with landscape cover picture
  const renderMovieCard = (item: MediaItem, index?: number) => {
    const coverImage = item.backdrop_path || item.poster_path;

    return (
      <motion.div
        key={item.id || `${item.media_type}-${item.tmdb_id}-${index}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.25, delay: (index ?? 0) * 0.08 }}
        className="rounded-2xl bg-[#16181F] border border-[#E5A93C]/35 overflow-hidden shadow-2xl relative"
      >
        {/* Landscape Style Cover Picture */}
        <div
          onClick={() => openDetailModal(item)}
          className="relative aspect-[16/8] sm:aspect-[21/9] w-full bg-[#14161B] overflow-hidden cursor-pointer group"
        >
          {coverImage ? (
            <img
              src={coverImage}
              alt={item.title}
              className="w-full h-full object-cover object-center opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-900 to-[#14161B]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#16181F] via-[#16181F]/20 to-black/30" />
        </div>

        {/* Card Content */}
        <div className="p-4 sm:p-5 pt-3">
          {/* Metadata Row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#F5C518] text-black">
              IMDb
            </span>
            <span className="text-xs font-bold text-white tabular-nums">
              {(typeof item.vote_average === 'number' ? item.vote_average : 0).toFixed(1)}
            </span>
            <span className="text-xs text-[#8E93A0]">•</span>
            <span className="text-xs text-[#8E93A0]">{item.release_year || ''}</span>
            <span className="text-xs text-[#8E93A0]">•</span>
            <span className="text-[10px] uppercase font-semibold text-white/60">
              {item.media_type === 'tv' ? 'Series' : 'Movie'}
            </span>
            {typeof item.runtime === 'number' && item.runtime > 0 && (
              <>
                <span className="text-xs text-[#8E93A0]">•</span>
                <span className="text-xs text-[#8E93A0] tabular-nums">
                  {item.runtime >= 60
                    ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m`
                    : `${item.runtime}m`}
                </span>
              </>
            )}
          </div>

          {/* Clickable Title */}
          <h3
            onClick={() => openDetailModal(item)}
            className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug cursor-pointer hover:text-[#E5A93C] transition-colors"
          >
            {item.title}
          </h3>

          {/* Overview */}
          {item.overview && (
            <p className="text-xs text-[#D1D5DB] line-clamp-3 mt-1.5 leading-relaxed">
              {item.overview}
            </p>
          )}

          {/* Action Row - Strict Single Line (No Wrapping) */}
          <div className="mt-3.5 pt-2.5 border-t border-white/[0.08] flex items-center gap-1.5 w-full">
            {item.primary_source ? (
              <a
                href={getServiceUrl(item.primary_source, item.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-500 text-black font-bold text-xs shadow-md hover:bg-emerald-400 transition-colors whitespace-nowrap"
              >
                <Play className="w-3 h-3 fill-black shrink-0" />
                <span className="truncate">{item.primary_source}</span>
                <ExternalLink className="w-2.5 h-2.5 stroke-[2.5] shrink-0" />
              </a>
            ) : (
              <div className="flex-1" />
            )}

            <button
              type="button"
              onClick={() => handleActionAndReroll(item, 'want_to_watch')}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/[0.08] text-xs text-white/90 font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="Add to Watchlist and roll replacement"
            >
              <Bookmark className="w-3.5 h-3.5 text-white/80 shrink-0" />
              <span>Watchlist</span>
            </button>

            <button
              type="button"
              onClick={() => handleActionAndReroll(item, 'watched')}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30 border border-white/[0.08] text-xs text-white/90 font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="Mark as watched and roll replacement"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5] shrink-0" />
              <span>Watched</span>
            </button>

            <button
              type="button"
              onClick={() => openDetailModal(item)}
              className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              Details
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto w-full pb-10">
      {/* Header Container */}
      <div className="mb-3 sm:mb-5 pb-2.5 sm:pb-3 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#E5A93C]/10 border border-[#E5A93C]/25 flex items-center justify-center text-[#E5A93C]">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
              Tonight&apos;s Pick
            </h1>
            <p className="text-[11px] sm:text-xs text-[#8E93A0]">
              Dial your mood & roll.
            </p>
          </div>
        </div>
      </div>

      {/* Main Controls Card */}
      <div className="bg-[#111317] border border-white/[0.08] rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4 shadow-xl">
        {/* 1. Select Pool */}
        <div>
          <label className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#8E93A0] mb-1.5 block">
            1. Select Pool
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setPoolSource('watchlist');
                setPickedItem(null);
                setShowThreePicks(false);
              }}
              className={`py-2 px-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                poolSource === 'watchlist'
                  ? 'bg-white/10 border-white/30 text-white shadow-sm'
                  : 'bg-[#16181F] border-white/[0.06] text-[#8E93A0] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-xs font-semibold">From My Watchlist</span>
              <Bookmark className="w-3.5 h-3.5 opacity-70 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => {
                setPoolSource('catalog');
                setPickedItem(null);
                setShowThreePicks(false);
              }}
              className={`py-2 px-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                poolSource === 'catalog'
                  ? 'bg-white/10 border-white/30 text-white shadow-sm'
                  : 'bg-[#16181F] border-white/[0.06] text-[#8E93A0] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-xs font-semibold">Curated by Mirar</span>
              <Film className="w-3.5 h-3.5 opacity-70 shrink-0" />
            </button>
          </div>
        </div>

        {/* 2. Format */}
        <div>
          <label className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#8E93A0] mb-1.5 block">
            2. Format
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'any' as const, label: 'Any Format' },
              { id: 'movie' as const, label: 'Movie' },
              { id: 'tv' as const, label: 'TV Series' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => {
                  setSelectedFormat(fmt.id);
                  setSelectedLength('any');
                  setPickedItem(null);
                  setShowThreePicks(false);
                }}
                className={`px-3 py-1 rounded-lg text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
                  selectedFormat === fmt.id
                    ? 'bg-white text-black font-semibold border-white shadow-sm'
                    : 'bg-[#16181F] text-[#8E93A0] border-white/[0.06] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Length */}
        <div>
          <label className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#8E93A0] mb-1.5 block">
            {selectedFormat === 'tv' ? '3. Episode Length' : selectedFormat === 'movie' ? '3. Movie Runtime' : '3. Length'}
          </label>
          <div className="flex items-center gap-1 sm:gap-1.5 w-full">
            {selectedFormat === 'movie' && (
              <>
                {[
                  { id: 'any', label: 'Any Length' },
                  { id: 'short', label: '< 100 min' },
                  { id: 'standard', label: '100–140 min' },
                  { id: 'epic', label: '140+ min' },
                ].map((len) => (
                  <button
                    key={len.id}
                    type="button"
                    onClick={() => {
                      setSelectedLength(len.id);
                      setPickedItem(null);
                      setShowThreePicks(false);
                    }}
                    className={`flex-1 py-1 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-medium border transition-all text-center whitespace-nowrap cursor-pointer ${
                      selectedLength === len.id
                        ? 'bg-white text-black font-semibold border-white shadow-sm'
                        : 'bg-[#16181F] text-[#8E93A0] border-white/[0.06] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {len.label}
                  </button>
                ))}
              </>
            )}

            {selectedFormat === 'tv' && (
              <>
                {[
                  { id: 'any', label: 'Any Length' },
                  { id: 'tv_short', label: '< 30 min' },
                  { id: 'tv_standard', label: '30–50 min' },
                  { id: 'tv_long', label: '50+ min' },
                ].map((len) => (
                  <button
                    key={len.id}
                    type="button"
                    onClick={() => {
                      setSelectedLength(len.id);
                      setPickedItem(null);
                      setShowThreePicks(false);
                    }}
                    className={`flex-1 py-1 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-medium border transition-all text-center whitespace-nowrap cursor-pointer ${
                      selectedLength === len.id
                        ? 'bg-white text-black font-semibold border-white shadow-sm'
                        : 'bg-[#16181F] text-[#8E93A0] border-white/[0.06] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {len.label}
                  </button>
                ))}
              </>
            )}

            {selectedFormat === 'any' && (
              <>
                {[
                  { id: 'any', label: 'Any' },
                  { id: 'any_short', label: '< 45m' },
                  { id: 'any_med', label: '45–90m' },
                  { id: 'any_long', label: '90–130m' },
                  { id: 'any_epic', label: '130m+' },
                ].map((len) => (
                  <button
                    key={len.id}
                    type="button"
                    onClick={() => {
                      setSelectedLength(len.id);
                      setPickedItem(null);
                      setShowThreePicks(false);
                    }}
                    className={`flex-1 py-1 px-0.5 sm:px-1.5 rounded-lg text-[10px] sm:text-xs font-medium border transition-all text-center whitespace-nowrap cursor-pointer ${
                      selectedLength === len.id
                        ? 'bg-white text-black font-semibold border-white shadow-sm'
                        : 'bg-[#16181F] text-[#8E93A0] border-white/[0.06] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {len.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* 4. Mood & Vibe Chips */}
        <div>
          <label className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#8E93A0] mb-1.5 block">
            4. Mood & Vibe
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {VIBE_OPTIONS.map((vibe) => (
              <button
                key={vibe.id}
                type="button"
                onClick={() => {
                  setSelectedVibe(vibe.id);
                  setPickedItem(null);
                  setShowThreePicks(false);
                }}
                className={`py-1.5 px-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedVibe === vibe.id
                    ? 'bg-[#E5A93C]/15 border-[#E5A93C]/40 text-white shadow-sm'
                    : 'bg-[#16181F] border-white/[0.06] text-[#8E93A0] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-xs shrink-0">{vibe.emoji}</span>
                <span className="text-[11px] font-medium text-white truncate">{vibe.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Streaming Now Toggle */}
        <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#16181F] border border-white/[0.06]">
          <div className="text-xs font-semibold text-white">Streaming Now</div>
          <button
            type="button"
            onClick={() => setOnlySubscribed(!onlySubscribed)}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              onlySubscribed ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                onlySubscribed ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Candidate Count */}
        <div className="flex items-center justify-between text-[11px] text-[#8E93A0] px-0.5">
          <span>
            {isPoolLoading && eligibleItems.length === 0
              ? 'Finding candidate titles...'
              : `${eligibleItems.length} candidate titles available`}
          </span>
          {!isPoolLoading && eligibleItems.length === 0 && (
            <span className="text-amber-400 font-medium">Broaden filters</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            disabled={eligibleItems.length === 0 || isSpinning || (isPoolLoading && eligibleItems.length === 0)}
            onClick={handleRoll}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 rounded-xl bg-white text-black font-bold text-xs sm:text-sm hover:bg-neutral-200 transition-all active:scale-98 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Dice5 className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Rolling...' : "Roll Tonight's Pick"}</span>
          </button>

          <button
            type="button"
            disabled={eligibleItems.length === 0 || isSpinning || (isPoolLoading && eligibleItems.length === 0)}
            onClick={handlePickThree}
            className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-semibold text-xs border border-white/[0.1] transition-all cursor-pointer whitespace-nowrap"
          >
            Give Me 3 Choices
          </button>
        </div>

        {/* RESULTS CONTAINER - Auto centered via scrollIntoView */}
        <div ref={resultsRef} className="pt-2">
          {/* RESULT: SINGLE PICK */}
          <AnimatePresence mode="wait">
            {pickedItem && !showThreePicks && renderMovieCard(pickedItem)}
          </AnimatePresence>

          {/* RESULT: 3 CHOICES COMPARISON */}
          <AnimatePresence mode="wait">
            {showThreePicks && threePicks.length > 0 && (
              <div className="space-y-4 pt-1">
                <div className="text-xs font-semibold text-white/80">
                  Pick from your top 3 curated matches:
                </div>
                <div className="flex flex-col gap-4">
                  {threePicks.map((pick, i) => renderMovieCard(pick, i))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
