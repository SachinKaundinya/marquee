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
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0E1015] border-t border-white/[0.08] sm:hidden pb-[max(env(safe-area-inset-bottom,0px),4px)] pt-1 shadow-[0_-4px_16px_rgba(0,0,0,0.5)]">
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
              className={`flex flex-col items-center justify-center py-0.5 px-2 relative transition-all cursor-pointer ${
                isActive ? 'text-white' : 'text-[#8E93A0] hover:text-[#C5C8D0]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-4 h-4 transition-transform ${
                    isActive ? 'scale-105 text-white' : 'text-[#8E93A0]'
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {item.badge !== null && (
                  <span className="absolute -top-1 -right-2.5 px-1 min-w-[14px] h-3.5 text-[8px] font-bold rounded-full bg-white text-black flex items-center justify-center tabular-nums shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] leading-tight mt-0.5 tracking-tight transition-colors ${
                  isActive ? 'font-semibold text-white' : 'font-normal text-[#8E93A0]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
