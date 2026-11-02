'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  Bookmark,
  Play,
  Check,
  EyeOff,
  ExternalLink,
  Film,
  Tv,
  Clapperboard,
  Clock,
  Sparkles,
  Share2,
  Calendar,
  Volume2
} from 'lucide-react';
import { useMedia } from '@/context/MediaContext';
import { MediaItem, MediaType, TrackingStatus } from '@/types/media';
import { MediaPoster } from '@/components/MediaPoster';
import { fetchFullMediaDetails, FullMediaDetails } from '@/lib/tmdb';
import { getImdbRating, fetchLiveImdbRating } from '@/lib/imdbRatings';
import { drawerTransition, tapScale } from '@/tokens/motion';
import { toast } from 'sonner';

export function getServiceUrl(service: string, title: string): string {
  const enc = encodeURIComponent(title);
  const s = service.toLowerCase();
  if (s.includes('netflix')) return `https://www.netflix.com/search?q=${enc}`;
  if (s.includes('apple')) return `https://tv.apple.com/search?term=${enc}`;
  if (s.includes('max') || s.includes('hbo')) return `https://play.max.com/search?q=${enc}`;
  if (s.includes('prime') || s.includes('amazon')) return `https://www.amazon.com/s?k=${enc}&i=instant-video`;
  if (s.includes('hulu')) return `https://www.hulu.com/search?q=${enc}`;
  if (s.includes('disney')) return `https://www.disneyplus.com/search?q=${enc}`;
  if (s.includes('peacock')) return `https://www.peacocktv.com/watch/search?q=${enc}`;
  if (s.includes('paramount')) return `https://www.paramountplus.com/search/?q=${enc}`;
  if (s.includes('criterion')) return `https://www.criterionchannel.com/search?q=${enc}`;
  if (s.includes('theaters')) return `https://www.fandango.com/search?q=${enc}`;
  return `https://www.google.com/search?q=where+to+watch+${enc}`;
}

export function formatRuntime(mins?: number): string | null {
  if (!mins || mins <= 0) return null;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  if (hours === 0) return `${remaining}m`;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}

export function CinematicDetailModal() {
  const {
    selectedDetailItem,
    closeDetailModal,
    getUserTitle,
    updateStatus,
    openQuickLog,
    markNotInterested,
    isServiceSubscribed,
  } = useMedia();

  const [details, setDetails] = useState<FullMediaDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [liveRating, setLiveRating] = useState<number | null>(null);
  const [ratingSource, setRatingSource] = useState<'imdb' | 'tmdb'>('imdb');

  const item = selectedDetailItem;
  const userTitle = item ? getUserTitle(item.tmdb_id, item.media_type) : undefined;
  const currentStatus = userTitle?.status;

  useEffect(() => {
    if (!item) {
      setDetails(null);
      setIsPlayingTrailer(false);
      setLiveRating(null);
      setRatingSource('imdb');
      return;
    }

    setIsPlayingTrailer(false);
    setIsLoading(true);

    // Initial sync lookup for verified IMDb rating
    const syncRating = getImdbRating(item.title, item.tmdb_id);
    if (syncRating !== undefined) {
      setLiveRating(syncRating);
      setRatingSource('imdb');
    } else {
      setLiveRating(item.vote_average);
      setRatingSource(item.rating_source || 'tmdb');
      // Attempt live async OMDb lookup
      fetchLiveImdbRating(item.title, item.release_year, item.tmdb_id).then((res) => {
        if (res?.rating) {
          setLiveRating(res.rating);
          setRatingSource('imdb');
        }
      });
    }

    // Fetch credits, runtime, trailer from TMDb
    fetchFullMediaDetails(item.media_type, item.tmdb_id, item.title)
      .then((data) => {
        setDetails(data);
        if (data.imdb_id) {
          fetchLiveImdbRating(item.title, item.release_year, item.tmdb_id, data.imdb_id).then((res) => {
            if (res?.rating) {
              setLiveRating(res.rating);
              setRatingSource('imdb');
            }
          });
        }
      })
      .catch(() => {
        setDetails(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [item]);

  if (!item) return null;

  const displayRating = liveRating || details?.vote_average || item.vote_average;
  const runtime = details?.runtime;
  const formattedRuntime = formatRuntime(runtime);
  const creator = details?.creator || item.creator || item.director;
  const stars = details?.stars || item.stars || [];
  const backdrop = details?.backdrop_path || item.backdrop_path;
  const trailerKey = details?.trailerKey;
  const overview = details?.overview || item.overview;
  const genres = details?.genres && details.genres.length > 0 ? details.genres : item.genres;
  const streamingSources = item.streaming_sources || (item.primary_source ? [item.primary_source] : []);

  const handleStatusToggle = (newStatus: TrackingStatus) => {
    if (currentStatus === newStatus) {
      // Toggle off / remove
      openQuickLog(item, newStatus);
      return;
    }

    if (newStatus === 'watched') {
      // Open quick log to allow star rating & notes
      closeDetailModal();
      openQuickLog(item, 'watched');
      return;
    }

    updateStatus(item.tmdb_id, item.media_type, newStatus);
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/?title=${item.tmdb_id}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      toast.success('Share link copied to clipboard!', { description: item.title });
    } catch {
      toast.info('Share ready');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeDetailModal}
          className="fixed inset-0 bg-black/85 transition-opacity"
          style={{ WebkitBackdropFilter: 'none', backdropFilter: 'none' }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={drawerTransition}
          className="relative w-full max-w-3xl bg-[#0F1115] border border-white/[0.09] sm:rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[92vh] sm:max-h-[88vh] flex flex-col my-auto"
        >
          {/* Top Banner / Widescreen Backdrop Canvas */}
          <div className="relative aspect-[16/8] sm:aspect-[21/9] w-full bg-[#14161B] overflow-hidden shrink-0">
            {backdrop ? (
              <img
                src={backdrop}
                alt={item.title}
                className="w-full h-full object-cover object-top opacity-70 brightness-[0.85]"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-900 to-[#14161B]" />
            )}

            {/* Gradient Mask to Fade Seamlessly Into Body */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F1115]/70 via-transparent to-transparent hidden sm:block" />

            {/* Top Bar Actions (Close) */}
            <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
              <button
                type="button"
                onClick={closeDetailModal}
                aria-label="Close"
                className="p-2.5 sm:p-3 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 transition-all active:scale-95 cursor-pointer shadow-lg"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* Trailer Play Pill in Banner if available */}
            {trailerKey && !isPlayingTrailer && (
              <button
                type="button"
                onClick={() => setIsPlayingTrailer(true)}
                className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-black font-semibold text-xs shadow-lg hover:bg-neutral-200 transition-transform active:scale-95 cursor-pointer backdrop-blur-sm"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Watch Trailer</span>
              </button>
            )}

            {/* Mobile / Header Floating Poster on larger screens */}
            <div className="absolute bottom-3 left-4 sm:left-6 flex items-end gap-4 z-20">
              <div className="hidden sm:block w-24 md:w-28 shadow-2xl rounded-lg overflow-hidden border border-white/20 shrink-0">
                <MediaPoster
                  src={item.poster_path}
                  title={item.title}
                  mediaType={item.media_type}
                  year={item.release_year}
                />
              </div>
              <div className="max-w-xl">
                <div className="flex items-center gap-2 text-xs text-[#8E93A0] mb-1">
                  <span className="uppercase tracking-wider font-semibold text-white/60">
                    {item.media_type === 'tv' ? 'Series' : 'Feature'}
                  </span>
                  {item.release_year && (
                    <>
                      <span>•</span>
                      <span className="font-mono tabular-nums">{item.release_year}</span>
                    </>
                  )}
                  {formattedRuntime && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[#8E93A0]">
                        <Clock className="w-3 h-3" />
                        {formattedRuntime}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight drop-shadow-md">
                  {item.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Embedded Trailer Section (Expandable) */}
          <AnimatePresence>
            {isPlayingTrailer && trailerKey && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="relative w-full aspect-video bg-black shrink-0 border-b border-white/10"
              >
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0`}
                  title={`${item.title} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
                <button
                  type="button"
                  onClick={() => setIsPlayingTrailer(false)}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/80 hover:bg-black text-xs text-white border border-white/20 backdrop-blur-md"
                >
                  Close Trailer
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
            {/* Tagline */}
            {details?.tagline && (
              <p className="text-xs sm:text-sm italic text-[#8E93A0] border-l-2 border-[#E5A93C]/60 pl-3">
                &ldquo;{details.tagline}&rdquo;
              </p>
            )}

            {/* Ratings & Metadata Bar */}
            <div className="flex flex-wrap items-center gap-3 py-2 px-3 rounded-xl bg-[#14161B] border border-white/[0.06]">
              {/* Official IMDb or TMDb Score Badge */}
              <div className="flex items-center gap-1.5">
                {ratingSource === 'imdb' ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black tracking-tight bg-[#F5C518] text-black font-sans shadow-sm">
                    IMDb
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight bg-sky-950/80 text-sky-300 border border-sky-500/30 font-sans shadow-sm">
                    TMDb
                  </span>
                )}
                <span className="text-sm font-bold text-[#F3F4F6] tabular-nums">
                  {displayRating ? displayRating.toFixed(1) : '7.5'}
                </span>
                <span className="text-[10px] text-[#8E93A0]">/10</span>
              </div>

              <div className="h-4 w-px bg-white/10" />

              {/* Genre Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.04] text-[#8E93A0] border border-white/[0.05]"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Synopsis */}
            {overview && (
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8E93A0] mb-1.5">
                  Overview
                </h3>
                <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed">
                  {overview}
                </p>
              </div>
            )}

            {/* Cast & Director */}
            {(creator || stars.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {creator && (
                  <div className="p-3 rounded-lg bg-[#14161B] border border-white/[0.06]">
                    <div className="text-[10px] uppercase font-semibold text-[#8E93A0] mb-1 flex items-center gap-1.5">
                      <Clapperboard className="w-3 h-3 text-[#E5A93C]" />
                      <span>{item.media_type === 'tv' ? 'Creator / Showrunner' : 'Director'}</span>
                    </div>
                    <div className="font-medium text-white truncate">{creator}</div>
                  </div>
                )}
                {stars.length > 0 && (
                  <div className="p-3 rounded-lg bg-[#14161B] border border-white/[0.06]">
                    <div className="text-[10px] uppercase font-semibold text-[#8E93A0] mb-1">
                      Key Cast
                    </div>
                    <div className="font-medium text-white line-clamp-1">
                      {stars.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Where to Stream Direct Deep Links */}
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8E93A0] mb-2">
                Where to Watch
              </h3>
              {streamingSources.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {streamingSources.map((source) => {
                    const isSubscribed = isServiceSubscribed(source);
                    const url = getServiceUrl(source, item.title);

                    return (
                      <a
                        key={source}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer group ${
                          isSubscribed
                            ? 'bg-emerald-950/20 border-emerald-500/30 hover:bg-emerald-950/40 text-emerald-300'
                            : 'bg-[#14161B] border-white/[0.07] hover:bg-white/[0.06] text-[#F3F4F6]'
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-1">
                          <span className="text-xs font-semibold truncate group-hover:text-white">
                            {source}
                          </span>
                          <span className="text-[10px] text-[#8E93A0]">
                            {isSubscribed ? 'Subscribed' : 'Stream or Rent'}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-[#8E93A0] py-2">
                  Streaming info updating...
                </div>
              )}
            </div>
          </div>

          {/* Sticky Bottom Action Dock */}
          <div className="border-t border-white/[0.08] bg-[#0A0B0D] p-2.5 sm:p-4 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Watchlist Toggle */}
            <button
              type="button"
              onClick={() => handleStatusToggle('want_to_watch')}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 sm:px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentStatus === 'want_to_watch'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 shrink-0 fill-current" />
              <span className="whitespace-nowrap truncate">{currentStatus === 'want_to_watch' ? 'Saved' : 'Watchlist'}</span>
            </button>

            {/* Now Watching Toggle (For Series & Movies) */}
            <button
              type="button"
              onClick={() => handleStatusToggle('watching')}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 sm:px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentStatus === 'watching'
                  ? 'bg-[#E5A93C] text-black shadow-md font-bold'
                  : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1]'
              }`}
            >
              <Play className="w-3.5 h-3.5 shrink-0 fill-current" />
              <span className="whitespace-nowrap truncate">Watching</span>
            </button>

            {/* Log as Watched */}
            <button
              type="button"
              onClick={() => handleStatusToggle('watched')}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 sm:px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentStatus === 'watched'
                  ? 'bg-emerald-500 text-black shadow-md font-bold'
                  : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1]'
              }`}
            >
              <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
              <span className="whitespace-nowrap truncate">{currentStatus === 'watched' ? 'Watched' : 'Log'}</span>
            </button>

            {/* Not Interested / Hide */}
            <button
              type="button"
              onClick={() => {
                markNotInterested(item.tmdb_id, item.media_type);
                closeDetailModal();
                toast.info('Title hidden from recommendations');
              }}
              title="Not Interested"
              className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-red-500/10 hover:text-red-400 text-[#8E93A0] border border-white/[0.06] transition-colors shrink-0"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
