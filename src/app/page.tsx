'use client';

import React, { useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { AuthGate } from '@/components/AuthGate';
import { MediaProvider } from '@/context/MediaContext';
import { Navbar } from '@/components/Navbar';
import { NowWatchingShelf } from '@/components/NowWatchingShelf';
import { WatchlistGrid } from '@/components/WatchlistGrid';
import { DiaryFeed } from '@/components/DiaryFeed';
import { QuickLogModal } from '@/components/QuickLogModal';
import { CsvImportModal } from '@/components/CsvImportModal';
import { ApiSettingsModal } from '@/components/ApiSettingsModal';
import { ServicesModal } from '@/components/ServicesModal';
import { MobileBottomNav } from '@/components/MobileBottomNav';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'popular' | 'diary' | 'watchlist'>('popular');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);

  return (
    <AuthProvider>
      <AuthGate>
        <MediaProvider>
          <div className="min-h-screen bg-[#0A0B0D] text-[#F3F4F6] flex flex-col font-sans selection:bg-white/20 selection:text-white">
          {/* Top Navigation */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenImport={() => setIsImportOpen(true)}
            onOpenApiSettings={() => setIsApiSettingsOpen(true)}
          />

          {/* Main Content Area */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 pb-28 sm:pb-16">
            {activeTab === 'popular' && (
              <WatchlistGrid mode="popular" />
            )}

            {activeTab === 'diary' && (
              <>
                {/* Now Watching Active Series Shelf */}
                <NowWatchingShelf />

                {/* Chronological Watched Diary */}
                <DiaryFeed />
              </>
            )}

            {activeTab === 'watchlist' && (
              <WatchlistGrid
                mode="watchlist"
                onSwitchToPopular={() => setActiveTab('popular')}
              />
            )}
          </main>

          {/* iOS / Mobile Bottom Navigation Menu */}
          <MobileBottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

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
          <ServicesModal />


        </div>
      </MediaProvider>
    </AuthGate>
  </AuthProvider>
  );
}
