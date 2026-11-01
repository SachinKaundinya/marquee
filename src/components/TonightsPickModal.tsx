'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Dice5,
  Play,
  Film,
  Tv,
  Clock,
  Check,
  ExternalLink,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Flame,
  Clapperboard,
  Bookmark
} from 'lucide-react';
import { useMedia } from '@/context/MediaContext';
import { MediaItem, MediaType } from '@/types/media';
import { MediaPoster } from '@/components/MediaPoster';
import { getServiceUrl, formatRuntime } from '@/components/CinematicDetailModal';
import { drawerTransition, springTransition } from '@/tokens/motion';

type PoolSource = 'watchlist' | 'catalog';
type RuntimeBudget = 'any' | 'short' | 'standard' | 'epic' | 'series';
type VibeType = 'any' | 'mind_bender' | 'adrenaline' | 'comedy' | 'dark' | 'chills' | 'acclaimed';

interface VibeOption {
  id: VibeType;
  label: string;
  emoji: string;
  description: string;
}

const VIBE_OPTIONS: VibeOption[] = [
  { id: 'any', label: 'Surprise Me', emoji: '✨', description: 'Any mood or genre' },
  { id: 'mind_bender', label: 'Mind-Bender', emoji: '🌀', description: 'Sci-Fi, Mystery & Twists' },
  { id: 'adrenaline', label: 'Pure Adrenaline', emoji: '⚡', description: 'High-stakes Action & Crime' },
  { id: 'comedy', label: 'Laugh & Unwind', emoji: '🍿', description: 'Feel-good & Comedy' },
  { id: 'dark', label: 'Dark & Gripping', emoji: '🍷', description: 'Prestige Drama & Noir' },
  { id: 'chills', label: 'Spine-Chilling', emoji: '🕯️', description: 'Horror & Psychological' },
  { id: 'acclaimed', label: 'Top Shelf (8.0+)', emoji: '🏆', description: 'Universally acclaimed' },
];

export function TonightsPickModal() {
  const {
    isTonightsPickOpen,
    closeTonightsPick,
    watchlistTitles,
    catalog,
    isItemOnMyServices,
    isServiceSubscribed,
    openDetailModal,
    openQuickLog,
  } = useMedia();

  const [poolSource, setPoolSource] = useState<PoolSource>(
    watchlistTitles.length > 0 ? 'watchlist' : 'catalog'
  );
  const [runtimeBudget, setRuntimeBudget] = useState<RuntimeBudget>('any');
  const [selectedVibe, setSelectedVibe] = useState<VibeType>('any');
  const [onlySubscribed, setOnlySubscribed] = useState(true);

  // Shuffling / Result State
  const [isSpinning, setIsSpinning] = useState(false);
  const [pickedItem, setPickedItem] = useState<MediaItem | null>(null);
  const [showThreePicks, setShowThreePicks] = useState(false);
  const [threePicks, setThreePicks] = useState<MediaItem[]>([]);

  // Filter pool candidates
  const eligibleItems = useMemo(() => {
    const rawList: MediaItem[] =
      poolSource === 'watchlist'
        ? (watchlistTitles.map((t) => t.media).filter(Boolean) as MediaItem[])
        : catalog;

    return rawList.filter((item) => {
      // 1. Streaming subscription check
      if (onlySubscribed && !isItemOnMyServices(item)) {
        return false;
      }

      // 2. Format / Runtime check
      if (runtimeBudget === 'series' && item.media_type !== 'tv') return false;
      if (runtimeBudget !== 'any' && runtimeBudget !== 'series' && item.media_type === 'tv') {
        return false;
      }

      // 3. Vibe check
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
      } else if (selectedVibe === 'acclaimed') {
        if (item.vote_average < 7.9) return false;
      }

      return true;
    });
  }, [poolSource, watchlistTitles, catalog, onlySubscribed, runtimeBudget, selectedVibe, isItemOnMyServices]);

  const handleRoll = () => {
    if (eligibleItems.length === 0) return;
    setIsSpinning(true);
    setShowThreePicks(false);

    // Dynamic shuffle duration
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * eligibleItems.length);
      setPickedItem(eligibleItems[randomIndex]);
      setIsSpinning(false);
    }, 450);
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
    }, 400);
  };

  if (!isTonightsPickOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeTonightsPick}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={drawerTransition}
          className="relative w-full max-w-2xl bg-[#0F1115] border border-white/[0.09] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col my-auto max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#14161B]/60 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E5A93C]/10 border border-[#E5A93C]/20 flex items-center justify-center text-[#E5A93C]">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Tonight&apos;s Pick</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-white/10 text-white/70">
                    Decision Engine
                  </span>
                </h2>
                <p className="text-[11px] text-[#8E93A0]">
                  Cure streaming paralysis. Dial your mood & roll.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeTonightsPick}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#8E93A0] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* 1. Pool Source Toggle */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8E93A0] mb-2 block">
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
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    poolSource === 'watchlist'
                      ? 'bg-white/10 border-white/30 text-white shadow-sm'
                      : 'bg-[#14161B] border-white/[0.06] text-[#8E93A0] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">My Watchlist</span>
                    <Bookmark className="w-3.5 h-3.5 opacity-70" />
                  </div>
                  <span className="text-[11px] text-[#8E93A0]">
                    From your {watchlistTitles.length} saved titles
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPoolSource('catalog');
                    setPickedItem(null);
                    setShowThreePicks(false);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    poolSource === 'catalog'
                      ? 'bg-white/10 border-white/30 text-white shadow-sm'
                      : 'bg-[#14161B] border-white/[0.06] text-[#8E93A0] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">Mirar Curated</span>
                    <Film className="w-3.5 h-3.5 opacity-70" />
                  </div>
                  <span className="text-[11px] text-[#8E93A0]">
                    Trending & highest-rated library
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Format & Length */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8E93A0] mb-2 block">
                2. Format & Length
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'any', label: 'Any Format' },
                  { id: 'short', label: 'Quick Movie (< 100m)' },
                  { id: 'standard', label: 'Feature (100–140m)' },
                  { id: 'epic', label: 'Epic (140m+)' },
                  { id: 'series', label: 'TV Series' },
                ].map((budget) => (
                  <button
                    key={budget.id}
                    type="button"
                    onClick={() => {
                      setRuntimeBudget(budget.id as RuntimeBudget);
                      setPickedItem(null);
                      setShowThreePicks(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      runtimeBudget === budget.id
                        ? 'bg-white text-black font-semibold border-white shadow-sm'
                        : 'bg-[#14161B] text-[#8E93A0] border-white/[0.06] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {budget.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Vibe Pills */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8E93A0] mb-2 block">
                3. Mood & Vibe
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {VIBE_OPTIONS.map((vibe) => (
                  <button
                    key={vibe.id}
                    type="button"
                    onClick={() => {
                      setSelectedVibe(vibe.id);
                      setPickedItem(null);
                      setShowThreePicks(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedVibe === vibe.id
                        ? 'bg-[#E5A93C]/15 border-[#E5A93C]/40 text-white shadow-sm'
                        : 'bg-[#14161B] border-white/[0.06] text-[#8E93A0] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                      <span>{vibe.emoji}</span>
                      <span>{vibe.label}</span>
                    </div>
                    <div className="text-[10px] text-[#8E93A0] mt-0.5 truncate">
                      {vibe.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Streaming Subscriptions Filter Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#14161B] border border-white/[0.06]">
              <div>
                <div className="text-xs font-semibold text-white">Only Subscribed Services</div>
                <div className="text-[11px] text-[#8E93A0]">
                  Strictly show titles available on your connected streaming platforms
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOnlySubscribed(!onlySubscribed)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  onlySubscribed ? 'bg-emerald-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    onlySubscribed ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Candidate Count Banner */}
            <div className="flex items-center justify-between text-xs text-[#8E93A0] px-1">
              <span>{eligibleItems.length} matching candidate titles available</span>
              {eligibleItems.length === 0 && (
                <span className="text-amber-400 font-medium">Try broadening your filters</span>
              )}
            </div>

            {/* ACTION BUTTONS (Single Roll vs Pick 3) */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={eligibleItems.length === 0 || isSpinning}
                onClick={handleRoll}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-black font-bold text-xs sm:text-sm hover:bg-neutral-200 transition-all active:scale-98 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Dice5 className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'Rolling the reel...' : "Roll Tonight's Pick"}</span>
              </button>

              <button
                type="button"
                disabled={eligibleItems.length === 0 || isSpinning}
                onClick={handlePickThree}
                className="px-4 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-semibold text-xs border border-white/[0.1] transition-all cursor-pointer"
              >
                Give Me 3 Choices
              </button>
            </div>

            {/* RESULT: SINGLE PICK PRESENTATION */}
            <AnimatePresence mode="wait">
              {pickedItem && !showThreePicks && (
                <motion.div
                  key={pickedItem.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="rounded-2xl bg-[#14161B] border border-[#E5A93C]/30 p-4 sm:p-5 shadow-2xl relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Poster */}
                    <div className="w-24 sm:w-28 shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                      <MediaPoster
                        src={pickedItem.poster_path}
                        title={pickedItem.title}
                        mediaType={pickedItem.media_type}
                        year={pickedItem.release_year}
                      />
                    </div>

                    {/* Metadata & Synopsis */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#F5C518] text-black">
                            IMDb
                          </span>
                          <span className="text-xs font-bold text-white tabular-nums">
                            {pickedItem.vote_average.toFixed(1)}
                          </span>
                          <span className="text-xs text-[#8E93A0]">•</span>
                          <span className="text-xs text-[#8E93A0]">{pickedItem.release_year}</span>
                          <span className="text-xs text-[#8E93A0]">•</span>
                          <span className="text-[10px] uppercase font-semibold text-white/60">
                            {pickedItem.media_type === 'tv' ? 'Series' : 'Movie'}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                          {pickedItem.title}
                        </h3>

                        <p className="text-xs text-[#D1D5DB] line-clamp-3 mt-1.5 leading-relaxed">
                          {pickedItem.overview}
                        </p>
                      </div>

                      {/* Stream On & Launch Actions */}
                      <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                        {pickedItem.primary_source && (
                          <a
                            href={getServiceUrl(pickedItem.primary_source, pickedItem.title)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs shadow-md hover:bg-emerald-400 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-black" />
                            <span>Stream on {pickedItem.primary_source}</span>
                            <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                          </a>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              closeTonightsPick();
                              openDetailModal(pickedItem);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors"
                          >
                            Full Details
                          </button>

                          <button
                            type="button"
                            onClick={handleRoll}
                            title="Roll Again"
                            className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[#8E93A0] hover:text-white transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* RESULT: 3 CHOICES COMPARISON */}
            <AnimatePresence mode="wait">
              {showThreePicks && threePicks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="space-y-3"
                >
                  <div className="text-xs font-semibold text-white/80">
                    Pick from your top 3 curated matches:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {threePicks.map((pick) => (
                      <div
                        key={pick.id}
                        className="p-3 rounded-xl bg-[#14161B] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="aspect-[2/3] w-full rounded-md overflow-hidden mb-2.5">
                            <MediaPoster
                              src={pick.poster_path}
                              title={pick.title}
                              mediaType={pick.media_type}
                              year={pick.release_year}
                            />
                          </div>
                          <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                            <span className="px-1 py-0.2 rounded text-[9px] font-black bg-[#F5C518] text-black">
                              IMDb
                            </span>
                            <span className="font-bold text-white">{pick.vote_average.toFixed(1)}</span>
                            <span className="text-[#8E93A0]">({pick.release_year})</span>
                          </div>
                          <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">
                            {pick.title}
                          </h4>
                          <p className="text-[11px] text-[#8E93A0] line-clamp-2">
                            {pick.overview}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              closeTonightsPick();
                              openDetailModal(pick);
                            }}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-medium text-white transition-colors text-center"
                          >
                            Details
                          </button>
                          {pick.primary_source && (
                            <a
                              href={getServiceUrl(pick.primary_source, pick.title)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            >
                              <span>Watch</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
