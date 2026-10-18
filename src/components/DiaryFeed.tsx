'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Repeat, Film, MapPin, Plus, Check } from 'lucide-react';
import { useMedia } from '@/context/MediaContext';
import { UserTitle } from '@/types/media';
import { springTransition } from '@/tokens/motion';
import { MediaPoster } from '@/components/MediaPoster';

export function DiaryFeed() {
  const { diaryTitles, openQuickLog, triggerSearchFocus } = useMedia();
  const [category, setCategory] = React.useState<'all' | 'movies' | 'tv'>('all');

  const movieCount = diaryTitles.filter(
    (t) => t.media_type === 'movie' || t.media?.media_type === 'movie'
  ).length;

  const tvCount = diaryTitles.filter(
    (t) => t.media_type === 'tv' || t.media?.media_type === 'tv'
  ).length;

  const displayedTitles = diaryTitles.filter((t) => {
    if (category === 'movies') return t.media_type === 'movie' || t.media?.media_type === 'movie';
    if (category === 'tv') return t.media_type === 'tv' || t.media?.media_type === 'tv';
    return true;
  });

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-[#8E93A0]" />
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

      {/* Categories Filter: All, Movies, TV Shows */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            category === 'all'
              ? 'bg-white text-black font-semibold border-white shadow-sm'
              : 'bg-[#14161B] text-[#8E93A0] hover:text-white border-white/[0.06] hover:bg-white/[0.04]'
          }`}
        >
          <span>All</span>
          <span
            className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
              category === 'all' ? 'bg-black/10 text-black' : 'bg-white/[0.06] text-[#8E93A0]'
            }`}
          >
            {diaryTitles.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCategory('movies')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            category === 'movies'
              ? 'bg-white text-black font-semibold border-white shadow-sm'
              : 'bg-[#14161B] text-[#8E93A0] hover:text-white border-white/[0.06] hover:bg-white/[0.04]'
          }`}
        >
          <span>Movies</span>
          <span
            className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
              category === 'movies' ? 'bg-black/10 text-black' : 'bg-white/[0.06] text-[#8E93A0]'
            }`}
          >
            {movieCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCategory('tv')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            category === 'tv'
              ? 'bg-white text-black font-semibold border-white shadow-sm'
              : 'bg-[#14161B] text-[#8E93A0] hover:text-white border-white/[0.06] hover:bg-white/[0.04]'
          }`}
        >
          <span>TV Shows</span>
          <span
            className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
              category === 'tv' ? 'bg-black/10 text-black' : 'bg-white/[0.06] text-[#8E93A0]'
            }`}
          >
            {tvCount}
          </span>
        </button>
      </div>

      {displayedTitles.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#14161B] border border-white/[0.08] max-w-lg mx-auto">
          <Film className="w-8 h-8 text-[#8E93A0] mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-medium text-[#F3F4F6] mb-1">
            {diaryTitles.length === 0
              ? 'Your diary is empty'
              : `No ${category === 'movies' ? 'movies' : 'TV shows'} in your diary`}
          </h4>
          <p className="text-xs text-[#8E93A0] max-w-xs mx-auto mb-4 leading-relaxed">
            {diaryTitles.length === 0
              ? 'Log movies or finished TV series to build your personal diary collection.'
              : `Switch category filter or add more titles to your diary.`}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {displayedTitles.map((title) => {
            const media = title.media;
            if (!media) return null;

            return (
              <motion.div
                key={title.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => openQuickLog(media)}
                className="group relative cursor-pointer flex flex-col"
              >
                {/* Poster Container */}
                <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden bg-[#14161B] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] group-hover:border-white/20 transition-all duration-200">
                  <MediaPoster
                    src={media.poster_path}
                    title={media.title}
                    mediaType={media.media_type}
                    year={media.release_year}
                  />

                  {/* Top Left Status Badge */}
                  <div className="absolute top-1.5 left-1.5 z-10">
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/90 text-white shadow-md backdrop-blur-sm">
                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                      <span>Watched</span>
                    </span>
                  </div>

                  {/* Top Right Rating Badge */}
                  {title.rating ? (
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/75 text-[#E5A93C] border border-white/10 shadow-md backdrop-blur-sm">
                        <Star className="w-2.5 h-2.5 fill-[#E5A93C] text-[#E5A93C]" />
                        <span>{title.rating.toFixed(1)}</span>
                      </span>
                    </div>
                  ) : media.vote_average ? (
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/75 text-white/90 border border-white/10 shadow-md backdrop-blur-sm">
                        <Star className="w-2.5 h-2.5 fill-[#E5A93C] text-[#E5A93C]" />
                        <span>{media.vote_average.toFixed(1)}</span>
                      </span>
                    </div>
                  ) : null}

                  {/* Rewatch tag if applicable */}
                  {title.is_rewatch && (
                    <div className="absolute bottom-1.5 left-1.5 z-10">
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-black/75 text-white/80 border border-white/10 backdrop-blur-sm">
                        <Repeat className="w-2.5 h-2.5 text-[#8E93A0]" />
                        <span>Rewatch</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Title, Year & Metadata */}
                <div className="mt-2 flex flex-col">
                  <h3 className="text-xs font-semibold text-[#F3F4F6] truncate tracking-tight group-hover:text-white transition-colors">
                    {media.title}
                  </h3>
                  <div className="flex items-center justify-between gap-1 text-[11px] text-[#8E93A0] mt-0.5">
                    <span className="tabular-nums">{media.release_year}</span>
                    <span className="truncate max-w-[12ch]">
                      {media.genres?.[0] || (media.media_type === 'movie' ? 'Film' : 'Series')}
                    </span>
                  </div>
                  {title.platform_name && (
                    <div className="flex items-center gap-1 text-[10px] text-[#636875] truncate mt-0.5">
                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{title.platform_name}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
