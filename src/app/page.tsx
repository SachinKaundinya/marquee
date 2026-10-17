'use client';

import React, { useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { MediaProvider } from '@/context/MediaContext';
import { Navbar } from '@/components/Navbar';
import { NowWatchingShelf } from '@/components/NowWatchingShelf';
import { WatchlistGrid } from '@/components/WatchlistGrid';
import { DiaryFeed } from '@/components/DiaryFeed';
import { QuickLogModal } from '@/components/QuickLogModal';
import { CsvImportModal } from '@/components/CsvImportModal';
import { ApiSettingsModal } from '@/components/ApiSettingsModal';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'shelf' | 'diary' | 'explore'>('shelf');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);

  return (
    <AuthProvider>
      <MediaProvider>
        <div className="min-h-screen bg-[#0A0B0D] text-[#F3F4F6] flex flex-col font-sans selection:bg-white/20 selection:text-white">
          {/* Top Navigation with Google Sign In & TMDb API Settings */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenImport={() => setIsImportOpen(true)}
            onOpenApiSettings={() => setIsApiSettingsOpen(true)}
          />

          {/* Main Content Area */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-8 pb-16">
            {activeTab === 'shelf' && (
              <>
                {/* TV Command Center */}
                <NowWatchingShelf />

                {/* Watchlist & Catalog Grid */}
                <WatchlistGrid />
              </>
            )}

            {activeTab === 'diary' && <DiaryFeed />}

            {activeTab === 'explore' && <WatchlistGrid />}
          </main>

          {/* Modals */}
          <QuickLogModal />
          <CsvImportModal
            isOpen={isImportOpen}
            onClose={() => setIsImportOpen(false)}
          />
          <ApiSettingsModal
            isOpen={isApiSettingsOpen}
            onClose={() => setIsApiSettingsOpen(false)}
          />

          {/* Micro-Craft Footer */}
          <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-[#8E93A0]">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold uppercase tracking-wider text-[#F3F4F6]">
                  Marquee
                </span>
                <span>•</span>
                <span>Title-Level Parity Architecture</span>
              </div>
              <div className="tabular-nums text-[11px] text-[#636875]">
                Built with Next.js 15, Tailwind CSS & Framer Motion
              </div>
            </div>
          </footer>
        </div>
      </MediaProvider>
    </AuthProvider>
  );
}
