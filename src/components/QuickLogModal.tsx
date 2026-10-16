'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Calendar as CalendarIcon, Film, Tv, Eye, Bookmark, Play } from 'lucide-react';
import { useMedia } from '@/context/MediaContext';
import { StarRating } from '@/components/StarRating';
import { TrackingStatus } from '@/types/media';
import { drawerTransition, tapScale } from '@/tokens/motion';

const PLATFORMS = [
  'Cinema / Theater',
  'Apple TV+',
  'Max',
  'Netflix',
  'Hulu',
  'Criterion Channel',
  'Prime Video',
  '4K Blu-ray / Disc',
  'Airplane / Other',
];

export function QuickLogModal() {
  const { quickLogItem, closeQuickLog, saveLog, getUserTitle } = useMedia();

  const item = quickLogItem?.item;
  const initialStatus = quickLogItem?.initialStatus;

  const existingTitle = item ? getUserTitle(item.tmdb_id, item.media_type) : undefined;

  const [status, setStatus] = useState<TrackingStatus>('watched');
  const [rating, setRating] = useState<number>(existingTitle?.rating ?? 4.0);
  const [notes, setNotes] = useState<string>(existingTitle?.notes ?? '');
  const [isRewatch, setIsRewatch] = useState<boolean>(existingTitle?.is_rewatch ?? false);
  const [platform, setPlatform] = useState<string>(
    existingTitle?.platform_name || item?.streaming_provider?.name || 'Cinema / Theater'
  );

  // Date seen
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const [watchedDate, setWatchedDate] = useState<string>(existingTitle?.watched_on || todayStr);
  const [dateSelection, setDateSelection] = useState<'today' | 'yesterday' | 'custom'>('today');

  useEffect(() => {
    if (quickLogItem?.item) {
      const existing = getUserTitle(quickLogItem.item.tmdb_id, quickLogItem.item.media_type);
      setStatus(initialStatus || existing?.status || 'watched');
      setRating(existing?.rating ?? 4.0);
      setNotes(existing?.notes ?? '');
      setIsRewatch(existing?.is_rewatch ?? false);
      setPlatform(
        existing?.platform_name ||
        quickLogItem.item.streaming_provider?.name ||
        (quickLogItem.item.media_type === 'movie' ? 'Cinema / Theater' : 'Apple TV+')
      );
      setWatchedDate(existing?.watched_on || todayStr);
      setDateSelection(
        existing?.watched_on === yesterdayStr
          ? 'yesterday'
          : existing?.watched_on === todayStr
          ? 'today'
          : existing?.watched_on
          ? 'custom'
          : 'today'
      );
    }
  }, [quickLogItem]);

  if (!quickLogItem || !item) return null;

  const handleDateQuickSelect = (type: 'today' | 'yesterday') => {
    setDateSelection(type);
    setWatchedDate(type === 'today' ? todayStr : yesterdayStr);
  };

  const handleSave = () => {
    saveLog({
      tmdb_id: item.tmdb_id,
      media_type: item.media_type,
      status,
      rating: status === 'watched' ? rating : null,
      notes: notes.trim() || null,
      is_rewatch: isRewatch,
      watched_on: status === 'watched' ? watchedDate : null,
      platform_name: platform,
      media: item,
    });
    closeQuickLog();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeQuickLog}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal / Bottom Sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={drawerTransition}
          className="relative w-full max-w-lg bg-[#14161B] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.06)] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#101216]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-12 rounded bg-black/40 overflow-hidden shrink-0 border border-white/[0.06]">
                <img
                  src={item.poster_path}
                  alt={item.title}
                  className="w-full h-full object-cover brightness-[0.96]"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-[#8E93A0]">
                    {item.media_type === 'movie' ? 'Film' : 'TV Series'}
                  </span>
                  <span className="text-xs text-[#8E93A0] tabular-nums">
                    {item.release_year}
                  </span>
                </div>
                <h3 className="text-base font-medium text-[#F3F4F6] truncate tracking-tight">
                  Log &quot;{item.title}&quot;
                </h3>
              </div>
            </div>

            <button
              onClick={closeQuickLog}
              className="p-1.5 rounded-lg text-[#8E93A0] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-5 space-y-5 overflow-y-auto">
            {/* Status Selector */}
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-[#8E93A0] mb-2 block">
                Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('want_to_watch')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    status === 'want_to_watch'
                      ? 'bg-white/10 text-white border-white/30 shadow-sm'
                      : 'bg-white/[0.02] text-[#8E93A0] border-white/[0.06] hover:bg-white/[0.05]'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  Want to Watch
                </button>

                {item.media_type === 'tv' && (
                  <button
                    type="button"
                    onClick={() => setStatus('watching')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      status === 'watching'
                        ? 'bg-white/10 text-white border-white/30 shadow-sm'
                        : 'bg-white/[0.02] text-[#8E93A0] border-white/[0.06] hover:bg-white/[0.05]'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    Watching
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setStatus('watched')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    item.media_type === 'movie' ? 'col-span-2' : ''
                  } ${
                    status === 'watched'
                      ? 'bg-white/10 text-white border-white/30 shadow-sm'
                      : 'bg-white/[0.02] text-[#8E93A0] border-white/[0.06] hover:bg-white/[0.05]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {item.media_type === 'tv' ? 'Finished Series' : 'Watched'}
                </button>
              </div>
            </div>

            {/* Date Seen (When marked as Watched) */}
            {status === 'watched' && (
              <div>
                <label className="text-[11px] uppercase tracking-wider font-semibold text-[#8E93A0] mb-2 block">
                  Date Seen
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDateQuickSelect('today')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      dateSelection === 'today'
                        ? 'bg-white/10 text-white border-white/30'
                        : 'bg-white/[0.02] text-[#8E93A0] border-white/[0.06] hover:bg-white/[0.05]'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDateQuickSelect('yesterday')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      dateSelection === 'yesterday'
                        ? 'bg-white/10 text-white border-white/30'
                        : 'bg-white/[0.02] text-[#8E93A0] border-white/[0.06] hover:bg-white/[0.05]'
                    }`}
                  >
                    Yesterday
                  </button>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={watchedDate}
                      onChange={(e) => {
                        setDateSelection('custom');
                        setWatchedDate(e.target.value);
                      }}
                      className="bg-white/[0.02] border border-white/[0.06] text-xs text-[#F3F4F6] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-white/30 tabular-nums cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Rating */}
            {status === 'watched' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-[#8E93A0]">
                    Rating
                  </label>
                  <span className="text-xs text-[#E5A93C] font-semibold tabular-nums">
                    {rating > 0 ? `${rating.toFixed(1)} / 5.0` : 'Tap to rate'}
                  </span>
                </div>
                <div className="py-1">
                  <StarRating
                    value={rating}
                    onChange={(val) => setRating(val)}
                    size="lg"
                    showLabel={false}
                  />
                </div>
              </div>
            )}

            {/* Platform / Location */}
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-[#8E93A0] mb-2 block">
                Platform / Venue
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-[#0D0E11] border border-white/[0.08] text-sm text-[#F3F4F6] rounded-lg px-3 py-2 focus:outline-none focus:border-white/30 transition-colors"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes & Diary Reflections */}
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-[#8E93A0] mb-2 block">
                Notes & Reflections (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Crisp reflections, favorite sequences, projection quality..."
                className="w-full bg-[#0D0E11] border border-white/[0.08] text-sm text-[#F3F4F6] rounded-lg p-3 placeholder-[#636875] focus:outline-none focus:border-white/30 leading-relaxed max-w-[65ch] transition-colors resize-none"
              />
            </div>

            {/* Rewatch Toggle */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRewatch}
                  onChange={(e) => setIsRewatch(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.04] text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-[#8E93A0]">
                  I have seen this title before (Rewatch)
                </span>
              </label>
            </div>
          </div>

          {/* Footer Save Action */}
          <div className="p-4 border-t border-white/[0.08] bg-[#101216]">
            <motion.button
              whileTap={tapScale}
              onClick={handleSave}
              className="w-full py-3 px-4 rounded-lg bg-[#F4F4F6] text-[#0A0B0D] font-medium text-sm flex items-center justify-center gap-2 hover:bg-white active:scale-[0.98] transition-all shadow-[0_4px_12px_rgba(255,255,255,0.12)] cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              Save to Diary
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
