'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Check, MoreVertical, Archive, ArrowDownToLine, Plus, Tv } from 'lucide-react';
import { useMedia } from '@/context/MediaContext';
import { UserTitle } from '@/types/media';
import { springTransition, tapScale } from '@/tokens/motion';

export function NowWatchingShelf() {
  const { nowWatchingTitles, updateStatus, openQuickLog } = useMedia();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [exitingId, setExitingId] = useState<string | null>(null);

  const handleMarkFinished = (title: UserTitle) => {
    setExitingId(title.id);
    setTimeout(() => {
      if (title.media) {
        openQuickLog(title.media, 'watched');
      }
      setExitingId(null);
    }, 220);
  };

  const handleMoveToDropped = (title: UserTitle) => {
    updateStatus(title.tmdb_id, title.media_type, 'dropped');
    setActiveMenuId(null);
  };

  const handleMoveToWatchlist = (title: UserTitle) => {
    updateStatus(title.tmdb_id, title.media_type, 'want_to_watch');
    setActiveMenuId(null);
  };

  return (
    <section className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#F3F4F6]">
            Now Watching
          </h2>
          <span className="text-xs text-[#8E93A0] tabular-nums font-mono px-1.5 py-0.5 rounded bg-white/[0.04]">
            {nowWatchingTitles.length} Active
          </span>
        </div>

        <div className="text-xs text-[#8E93A0]">
          {nowWatchingTitles.length >= 5 ? (
            <span className="text-[#E5A93C]">Shelf full (limit 5 for focus)</span>
          ) : (
            <span>Intentional shelf</span>
          )}
        </div>
      </div>

      {/* Empty State */}
      {nowWatchingTitles.length === 0 ? (
        <div className="p-8 rounded-xl bg-[#14161B] border border-white/[0.08] text-center max-w-lg mx-auto">
          <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-[#8E93A0]">
            <Tv className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-medium text-[#F3F4F6] mb-1">
            No active TV shows on your shelf
          </h3>
          <p className="text-xs text-[#8E93A0] mb-4 max-w-sm mx-auto leading-relaxed">
            Keep your viewing intentional. Track only the series you are currently engaged with.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {nowWatchingTitles.map((title) => {
              const media = title.media;
              if (!media) return null;
              const isExiting = exitingId === title.id;
              const provider = media.streaming_provider;

              return (
                <motion.div
                  key={title.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={
                    isExiting
                      ? { scale: 0.95, opacity: 0 }
                      : { scale: 1, opacity: 1 }
                  }
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={springTransition}
                  className="relative group rounded-xl bg-[#14161B] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] p-3.5 flex gap-4 transition-colors hover:bg-[#1C1F26]"
                >
                  {/* Poster (Strict 2:3 Aspect Ratio) */}
                  <div className="relative w-20 shrink-0 aspect-[2/3] rounded-md overflow-hidden bg-black/40 border border-white/[0.06]">
                    <img
                      src={media.poster_path}
                      alt={media.title}
                      className="w-full h-full object-cover brightness-[0.96]"
                      loading="lazy"
                    />
                    {provider && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-semibold text-white/90">
                        {provider.name}
                      </div>
                    )}
                  </div>

                  {/* Card Content & Actions */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {/* Top Bar with Context Menu */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-base font-medium text-[#F3F4F6] truncate tracking-tight">
                            {media.title}
                          </h3>
                          <p className="text-xs text-[#8E93A0] truncate mt-0.5">
                            {media.genres.slice(0, 2).join(' • ')}
                          </p>
                        </div>

                        {/* Menu Dropdown Toggle */}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(
                                activeMenuId === title.id ? null : title.id
                              )
                            }
                            className="p-1 rounded text-[#8E93A0] hover:text-white hover:bg-white/[0.08] transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Options */}
                          {activeMenuId === title.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-[#181A20] border border-white/[0.08] shadow-2xl py-1 z-30">
                              <button
                                type="button"
                                onClick={() => handleMoveToWatchlist(title)}
                                className="w-full px-3 py-1.5 text-left text-xs text-[#8E93A0] hover:text-white hover:bg-white/[0.06] flex items-center gap-2"
                              >
                                <ArrowDownToLine className="w-3.5 h-3.5" />
                                Move to Watchlist
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveToDropped(title)}
                                className="w-full px-3 py-1.5 text-left text-xs text-[#8E93A0] hover:text-white hover:bg-white/[0.06] flex items-center gap-2"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                Shelve / Drop
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Streaming Provider Callout */}
                      <div className="mt-2 text-xs text-[#8E93A0] flex items-center gap-1.5">
                        <span className="text-[#636875]">Available on:</span>
                        <span className="text-[#F3F4F6] font-medium">
                          {provider ? provider.name : 'Streaming Platform'}
                        </span>
                      </div>
                    </div>

                    {/* Direct Thumb Actions */}
                    <div className="flex items-center gap-2 pt-3">
                      {provider?.deep_link_url && (
                        <a
                          href={provider.deep_link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1.5 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-[#F3F4F6] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          Watch on {provider.name.split(' ')[0]}
                          <ExternalLink className="w-3 h-3 text-[#8E93A0]" />
                        </a>
                      )}

                      <motion.button
                        whileTap={tapScale}
                        onClick={() => handleMarkFinished(title)}
                        className="py-1.5 px-3 rounded-lg bg-[#F4F4F6] hover:bg-white text-[#0A0B0D] text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        Mark Finished
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
