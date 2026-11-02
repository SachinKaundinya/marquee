'use client';

import React from 'react';
import { Flame, BookOpen, Bookmark, Sparkles } from 'lucide-react';
import { useMedia } from '@/context/MediaContext';

interface MobileBottomNavProps {
  activeTab: 'tonight' | 'popular' | 'diary' | 'watchlist';
  setActiveTab: (tab: 'tonight' | 'popular' | 'diary' | 'watchlist') => void;
}

export function MobileBottomNav({ activeTab, setActiveTab }: MobileBottomNavProps) {
  const { watchlistTitles } = useMedia();

  const navItems = [
    {
      id: 'tonight' as const,
      label: 'Tonight',
      icon: Sparkles,
    },
    {
      id: 'popular' as const,
      label: 'Recs',
      icon: Flame,
    },
    {
      id: 'watchlist' as const,
      label: 'Watchlist',
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
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0E1015] border-t border-white/[0.08] sm:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.5)] h-[68px] flex items-center">
      <div className="grid grid-cols-4 w-full max-w-md mx-auto items-center">
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
              className={`flex flex-col items-center justify-center py-1 relative transition-all cursor-pointer ${
                isActive ? 'text-white' : 'text-[#8E93A0] hover:text-[#C5C8D0]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-105 text-white' : 'text-[#8E93A0]'
                  }`}
                  strokeWidth={isActive ? 2.4 : 1.9}
                />
                {item.badge !== null && (
                  <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[15px] h-3.5 text-[9px] font-bold rounded-full bg-white text-black flex items-center justify-center tabular-nums shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] leading-tight mt-1 tracking-tight transition-colors ${
                  isActive ? 'font-semibold text-white' : 'font-medium text-[#8E93A0]'
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
