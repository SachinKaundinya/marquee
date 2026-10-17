'use client';

import React from 'react';
import { Flame, BookOpen, Bookmark } from 'lucide-react';
import { useMedia } from '@/context/MediaContext';

interface MobileBottomNavProps {
  activeTab: 'popular' | 'diary' | 'watchlist';
  setActiveTab: (tab: 'popular' | 'diary' | 'watchlist') => void;
}

export function MobileBottomNav({ activeTab, setActiveTab }: MobileBottomNavProps) {
  const { watchlistTitles } = useMedia();

  const navItems = [
    {
      id: 'popular' as const,
      label: 'Recs',
      icon: Flame,
    },
    {
      id: 'watchlist' as const,
      label: 'My Watchlist',
      icon: Bookmark,
      badge: watchlistTitles.length > 0 ? watchlistTitles.length : null,
    },
    {
      id: 'diary' as const,
      label: 'Diary',
      icon: BookOpen,
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#101216]/95 backdrop-blur-xl border-t border-white/[0.08] sm:hidden pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]">
      <div className="grid grid-cols-3 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 relative transition-all cursor-pointer ${
                isActive ? 'text-white' : 'text-[#8E93A0] hover:text-[#C5C8D0]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-white' : 'text-[#8E93A0]'
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {item.badge !== null && (
                  <span className="absolute -top-1 -right-3 px-1.5 min-w-[16px] h-4 text-[9px] font-bold rounded-full bg-white text-black flex items-center justify-center tabular-nums shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight transition-colors ${
                  isActive ? 'font-semibold text-white' : 'font-normal text-[#8E93A0]'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
