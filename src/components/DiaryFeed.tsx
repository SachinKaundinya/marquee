'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Repeat, Calendar, Film, MapPin, Plus } from 'lucide-react';
import { useMedia } from '@/context/MediaContext';
import { UserTitle } from '@/types/media';
import { springTransition } from '@/tokens/motion';
import { MediaPoster } from '@/components/MediaPoster';

export function DiaryFeed() {
  const { diaryTitles, openQuickLog, triggerSearchFocus } = useMedia();

  // Group titles by Year and Month: "October 2026"
  const groupedTitles = diaryTitles.reduce<Record<string, UserTitle[]>>((acc, item) => {
    const dateStr = item.watched_on || item.created_at;
    const date = new Date(dateStr);
    const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const monthKeys = Object.keys(groupedTitles);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#8E93A0]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#F3F4F6]">
            Personal Diary
          </h2>
          <span className="text-xs text-[#8E93A0] tabular-nums font-mono px-1.5 py-0.5 rounded bg-white/[0.04]">
            {diaryTitles.length} Logged
          </span>
        </div>

        {/* Add to List Button */}
        <button
          type="button"
          onClick={() => triggerSearchFocus('diary')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-white border border-white/[0.1] transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add to List</span>
        </button>
      </div>

      {monthKeys.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#14161B] border border-white/[0.08] max-w-lg mx-auto">
          <Film className="w-8 h-8 text-[#8E93A0] mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-medium text-[#F3F4F6] mb-1">Your diary is empty</h4>
          <p className="text-xs text-[#8E93A0] max-w-xs mx-auto mb-4 leading-relaxed">
            Log movies or finished TV series to build your chronological viewing journal.
          </p>
          <button
            type="button"
            onClick={() => triggerSearchFocus('diary')}
            className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-[#F3F4F6] transition-colors cursor-pointer shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add to List</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {monthKeys.map((month) => {
            const titlesInMonth = groupedTitles[month];

            return (
              <div key={month} className="space-y-3">
                {/* Month Group Header */}
                <div className="text-xs font-semibold text-[#8E93A0] tracking-wider uppercase pl-1">
                  {month}
                </div>

                {/* Entry Rows */}
                <div className="space-y-2">
                  {titlesInMonth.map((title) => {
                    const media = title.media;
                    if (!media) return null;

                    const dateObj = new Date(title.watched_on || title.created_at);
                    const dayFormatted = dateObj.toLocaleDateString('en-US', {
                      day: '2-digit',
                      weekday: 'short',
                    });

                    return (
                      <motion.div
                        key={title.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={springTransition}
                        onClick={() => openQuickLog(media)}
                        className="group flex items-start gap-4 p-3.5 rounded-xl bg-[#14161B] border border-white/[0.08] hover:bg-[#1C1F26] transition-colors cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                      >
                        {/* Day Column */}
                        <div className="w-14 shrink-0 text-center pt-1">
                          <span className="text-sm font-bold text-[#F3F4F6] block tabular-nums">
                            {dayFormatted.split(' ')[1] || '16'}
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-[#8E93A0] block">
                            {dayFormatted.split(' ')[0] || 'Fri'}
                          </span>
                        </div>

                        {/* Poster Thumbnail */}
                        <div className="w-12 shrink-0">
                          <MediaPoster
                            src={media.poster_path}
                            title={media.title}
                            mediaType={media.media_type}
                            year={media.release_year}
                          />
                        </div>

                        {/* Title, Metadata, Rating, and Review Note */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <h4 className="text-sm font-medium text-[#F3F4F6] truncate tracking-tight group-hover:text-white transition-colors">
                                {media.title}
                              </h4>
                              <span className="text-xs text-[#8E93A0] tabular-nums">
                                ({media.release_year})
                              </span>
                              {title.is_rewatch && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#8E93A0] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                                  <Repeat className="w-2.5 h-2.5" />
                                  Rewatch
                                </span>
                              )}
                            </div>

                            {/* Rating Stars */}
                            {title.rating && (
                              <div className="flex items-center gap-1 shrink-0">
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: Math.floor(title.rating) }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className="w-3.5 h-3.5 fill-[#E5A93C] text-[#E5A93C]"
                                    />
                                  ))}
                                  {title.rating % 1 !== 0 && (
                                    <span className="text-[#E5A93C] text-xs font-bold">½</span>
                                  )}
                                </div>
                                <span className="text-xs text-[#E5A93C] font-semibold tabular-nums ml-1">
                                  {title.rating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Platform Tag */}
                          {title.platform_name && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-[#8E93A0]">
                              <MapPin className="w-3 h-3 text-[#636875]" />
                              <span>{title.platform_name}</span>
                            </div>
                          )}

                          {/* Notes snippet */}
                          {title.notes && (
                            <p className="mt-2 text-xs text-[#8E93A0] leading-relaxed max-w-[65ch] line-clamp-2 italic">
                              &ldquo;{title.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
