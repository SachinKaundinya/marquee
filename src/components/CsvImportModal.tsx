'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, CheckCircle2, AlertCircle, X, ArrowRight } from 'lucide-react';
import { useMedia } from '@/context/MediaContext';
import { UserTitle, MediaItem } from '@/types/media';
import { toast } from 'sonner';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CsvImportModal({ isOpen, onClose }: CsvImportModalProps) {
  const { importTitles, catalog } = useMedia();
  const [platform, setPlatform] = useState<'letterboxd' | 'imdb'>('letterboxd');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setProgress(50);
        const rows = results.data as Record<string, string>[];
        const newTitles: UserTitle[] = [];

        rows.forEach((row, idx) => {
          // Letterboxd format: Name, Year, Rating, Date, Rewatch
          // IMDb format: Title, Year, Your Rating, Date Rated, Const
          const title = row['Name'] || row['Title'];
          const year = parseInt(row['Year'] || '2024', 10);
          const rawRating = parseFloat(row['Rating'] || row['Your Rating'] || '0');
          const dateStr = row['Date'] || row['Date Rated'] || new Date().toISOString().split('T')[0];
          const isRewatch = row['Rewatch'] === 'Yes' || row['Rewatch'] === 'true';

          if (!title) return;

          // Scale 10-point IMDb rating down to 5-star
          const rating = platform === 'imdb' && rawRating > 5 ? rawRating / 2 : rawRating;

          // Find or construct matching media
          const matchedMedia = catalog.find(
            (c) => c.title.toLowerCase() === title.toLowerCase()
          ) || {
            id: 200000 + idx,
            tmdb_id: 200000 + idx,
            title,
            media_type: 'movie' as const,
            poster_path: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=780&auto=format&fit=crop&q=80',
            release_year: year || 2024,
            vote_average: rating > 0 ? rating * 2 : 7.5,
            genres: ['Imported'],
          };

          newTitles.push({
            id: `import-${Date.now()}-${idx}`,
            user_id: 'local-user',
            tmdb_id: matchedMedia.tmdb_id,
            media_type: matchedMedia.media_type,
            status: 'watched',
            rating: rating > 0 ? Math.min(5, Math.max(0.5, rating)) : null,
            notes: `Imported from ${platform === 'letterboxd' ? 'Letterboxd' : 'IMDb'}`,
            is_rewatch: isRewatch,
            watched_on: dateStr,
            platform_name: platform === 'letterboxd' ? 'Letterboxd Diary' : 'IMDb Export',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            media: matchedMedia,
          });
        });

        setProgress(100);
        setTimeout(() => {
          importTitles(newTitles);
          setImportedCount(newTitles.length);
          setIsProcessing(false);
          toast.success(`Successfully migrated ${newTitles.length} titles from ${platform}`);
          setTimeout(() => {
            onClose();
          }, 1200);
        }, 400);
      },
      error: () => {
        setIsProcessing(false);
        toast.error('Failed to parse CSV file. Please verify column headers.');
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-[#14161B] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.06)] p-6 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#8E93A0]" />
            <h3 className="text-base font-medium text-[#F3F4F6] tracking-tight">
              Migrate Diary & Watchlist
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8E93A0] hover:text-white hover:bg-white/[0.06]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Selector */}
        <div className="mb-5">
          <label className="text-xs text-[#8E93A0] font-medium mb-2 block uppercase tracking-wider">
            Select Export Source
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPlatform('letterboxd')}
              className={`p-3 rounded-lg border text-left text-xs font-medium transition-colors ${
                platform === 'letterboxd'
                  ? 'bg-white/10 text-white border-white/30'
                  : 'bg-white/[0.02] text-[#8E93A0] border-white/[0.06] hover:bg-white/[0.05]'
              }`}
            >
              <div className="font-semibold text-sm mb-0.5">Letterboxd</div>
              <div className="text-[11px] text-[#8E93A0]">watched.csv / ratings.csv</div>
            </button>

            <button
              type="button"
              onClick={() => setPlatform('imdb')}
              className={`p-3 rounded-lg border text-left text-xs font-medium transition-colors ${
                platform === 'imdb'
                  ? 'bg-white/10 text-white border-white/30'
                  : 'bg-white/[0.02] text-[#8E93A0] border-white/[0.06] hover:bg-white/[0.05]'
              }`}
            >
              <div className="font-semibold text-sm mb-0.5">IMDb</div>
              <div className="text-[11px] text-[#8E93A0]">ratings.csv (tt Const)</div>
            </button>
          </div>
        </div>

        {/* File Dropzone */}
        <div className="mb-5">
          <label className="block text-center border-2 border-dashed border-white/[0.12] rounded-xl p-6 hover:border-white/30 transition-colors cursor-pointer bg-white/[0.01]">
            <FileText className="w-8 h-8 text-[#8E93A0] mx-auto mb-2 opacity-60" />
            <span className="text-xs text-[#F3F4F6] block font-medium">
              {file ? file.name : 'Click to select CSV export file'}
            </span>
            <span className="text-[11px] text-[#8E93A0] block mt-1">
              Supports standard Letterboxd & IMDb exports
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Progress indicator */}
        {isProcessing && (
          <div className="mb-5 space-y-2">
            <div className="flex justify-between text-xs text-[#8E93A0]">
              <span>Parsing and mapping titles...</span>
              <span className="tabular-nums font-mono">{progress}%</span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#F4F4F6] h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Import Action */}
        <button
          onClick={handleImport}
          disabled={!file || isProcessing}
          className="w-full py-2.5 px-4 rounded-lg bg-[#F4F4F6] text-[#0A0B0D] font-medium text-xs flex items-center justify-center gap-2 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md"
        >
          {isProcessing ? 'Importing Batch...' : 'Begin Ingestion'}
          {!isProcessing && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
