'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserTitle, MediaItem, QuickLogInput, TrackingStatus, MediaType } from '@/types/media';
import { INITIAL_USER_TITLES, MOCK_CATALOG } from '@/data/mockCatalog';
import { toast } from 'sonner';
import { getTrendingTitles } from '@/lib/tmdb';

export const ALL_SERVICES = [
  'Apple TV+',
  'Max',
  'Netflix',
  'Hulu',
  'Prime Video',
  'Disney+',
  'Peacock',
  'Paramount+',
  'Criterion Channel',
  'MGM+',
];

interface MediaContextType {
  userTitles: UserTitle[];
  catalog: MediaItem[];
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  quickLogItem: { item: MediaItem; initialStatus?: TrackingStatus } | null;
  openQuickLog: (item: MediaItem, initialStatus?: TrackingStatus) => void;
  closeQuickLog: () => void;
  saveLog: (log: QuickLogInput) => void;
  updateStatus: (tmdbId: number, mediaType: MediaType, status: TrackingStatus) => void;
  removeTitle: (tmdbId: number, mediaType: MediaType) => void;
  nowWatchingTitles: UserTitle[];
  watchlistTitles: UserTitle[];
  diaryTitles: UserTitle[];
  importTitles: (titles: UserTitle[]) => void;
  getUserTitle: (tmdbId: number, mediaType: MediaType) => UserTitle | undefined;
  
  // Subscribed Services Management
  subscribedServices: string[];
  toggleSubscribedService: (serviceName: string) => void;
  setSubscribedServices: (services: string[]) => void;
  isServiceSubscribed: (serviceName: string) => boolean;
  isItemOnMyServices: (item: MediaItem) => boolean;
  isServicesModalOpen: boolean;
  openServicesModal: () => void;
  closeServicesModal: () => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

const STORAGE_KEY = 'marquee_user_titles_v2';
const SUBS_STORAGE_KEY = 'marquee_user_subscriptions_v2';

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [userTitles, setUserTitles] = useState<UserTitle[]>(INITIAL_USER_TITLES);
  const [catalog, setCatalog] = useState<MediaItem[]>(MOCK_CATALOG);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickLogItem, setQuickLogItem] = useState<{ item: MediaItem; initialStatus?: TrackingStatus } | null>(null);
  
  // Default subscribed services (e.g. Netflix, Apple TV+, Max)
  const [subscribedServices, setSubscribedServicesState] = useState<string[]>([
    'Apple TV+',
    'Max',
    'Netflix',
    'Prime Video',
  ]);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);

  // Hydrate from localStorage and fetch live trending titles
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUserTitles(parsed);
        }
      }
    } catch {
      // Ignore parse errors on first load
    }

    try {
      const storedSubs = localStorage.getItem(SUBS_STORAGE_KEY);
      if (storedSubs) {
        const parsed = JSON.parse(storedSubs);
        if (Array.isArray(parsed)) {
          setSubscribedServicesState(parsed);
        }
      }
    } catch {
      // Ignore
    }

    // Fetch live trending titles from TMDb
    getTrendingTitles()
      .then((trending) => {
        if (trending && trending.length > 0) {
          setCatalog((prev) => {
            const map = new Map<number, MediaItem>();
            trending.forEach((item) => map.set(item.tmdb_id, item));
            prev.forEach((item) => {
              if (!map.has(item.tmdb_id)) {
                map.set(item.tmdb_id, item);
              }
            });
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {
        // Retain mock catalog fallback
      });
  }, []);

  // Sync titles to localStorage
  const persistTitles = (titles: UserTitle[]) => {
    setUserTitles(titles);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(titles));
    } catch {
      // Storage quota or private mode
    }
  };

  // Subscribed services management
  const setSubscribedServices = (services: string[]) => {
    setSubscribedServicesState(services);
    try {
      localStorage.setItem(SUBS_STORAGE_KEY, JSON.stringify(services));
    } catch {
      //
    }
  };

  const toggleSubscribedService = (serviceName: string) => {
    const updated = subscribedServices.includes(serviceName)
      ? subscribedServices.filter((s) => s !== serviceName)
      : [...subscribedServices, serviceName];

    setSubscribedServices(updated);
    toast.success(
      updated.includes(serviceName)
        ? `Added ${serviceName} to your services`
        : `Removed ${serviceName} from your services`
    );
  };

  const isServiceSubscribed = (serviceName: string): boolean => {
    return subscribedServices.includes(serviceName);
  };

  const isItemOnMyServices = (item: MediaItem): boolean => {
    if (!item) return false;
    const sources = item.streaming_sources || (item.primary_source ? [item.primary_source] : []);
    return sources.some((source) => subscribedServices.includes(source));
  };

  const openQuickLog = (item: MediaItem, initialStatus?: TrackingStatus) => {
    setQuickLogItem({ item, initialStatus });
  };

  const closeQuickLog = () => {
    setQuickLogItem(null);
  };

  const getUserTitle = (tmdbId: number, mediaType: MediaType): UserTitle | undefined => {
    return userTitles.find((t) => t.tmdb_id === tmdbId && t.media_type === mediaType);
  };

  const updateStatus = (tmdbId: number, mediaType: MediaType, status: TrackingStatus) => {
    const existingIndex = userTitles.findIndex(
      (t) => t.tmdb_id === tmdbId && t.media_type === mediaType
    );

    const media =
      catalog.find((c) => c.tmdb_id === tmdbId && c.media_type === mediaType) ||
      userTitles[existingIndex]?.media;

    if (existingIndex >= 0) {
      const updated = [...userTitles];
      updated[existingIndex] = {
        ...updated[existingIndex],
        status,
        updated_at: new Date().toISOString(),
      };
      persistTitles(updated);
    } else if (media) {
      const newEntry: UserTitle = {
        id: `ut-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        user_id: 'local-user',
        tmdb_id: tmdbId,
        media_type: mediaType,
        status,
        is_rewatch: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        media,
      };
      persistTitles([newEntry, ...userTitles]);
    }

    const readableStatus =
      status === 'want_to_watch'
        ? 'Added to Watchlist'
        : status === 'watching'
        ? 'Moved to Now Watching'
        : status === 'watched'
        ? 'Logged to Diary'
        : 'Shelved / Dropped';

    toast.success(readableStatus, {
      description: media?.title || 'Title updated',
    });
  };

  const saveLog = (log: QuickLogInput) => {
    const existingIndex = userTitles.findIndex(
      (t) => t.tmdb_id === log.tmdb_id && t.media_type === log.media_type
    );

    const media =
      log.media ||
      catalog.find((c) => c.tmdb_id === log.tmdb_id && c.media_type === log.media_type) ||
      userTitles[existingIndex]?.media;

    if (existingIndex >= 0) {
      const updated = [...userTitles];
      updated[existingIndex] = {
        ...updated[existingIndex],
        status: log.status,
        rating: log.rating ?? updated[existingIndex].rating,
        notes: log.notes ?? updated[existingIndex].notes,
        is_rewatch: log.is_rewatch ?? updated[existingIndex].is_rewatch,
        watched_on:
          log.watched_on ??
          updated[existingIndex].watched_on ??
          new Date().toISOString().split('T')[0],
        platform_name: log.platform_name ?? updated[existingIndex].platform_name,
        streaming_provider_id:
          log.streaming_provider_id ?? updated[existingIndex].streaming_provider_id,
        updated_at: new Date().toISOString(),
        media: media || updated[existingIndex].media,
      };
      persistTitles(updated);
    } else {
      const newEntry: UserTitle = {
        id: `ut-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        user_id: 'local-user',
        tmdb_id: log.tmdb_id,
        media_type: log.media_type,
        status: log.status,
        rating: log.rating,
        notes: log.notes,
        is_rewatch: log.is_rewatch || false,
        watched_on:
          log.watched_on ||
          (log.status === 'watched' ? new Date().toISOString().split('T')[0] : null),
        platform_name: log.platform_name,
        streaming_provider_id: log.streaming_provider_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        media,
      };
      persistTitles([newEntry, ...userTitles]);
    }

    toast.success('Saved to Diary', {
      description: `${media?.title || 'Title'} recorded with high fidelity.`,
    });
  };

  const removeTitle = (tmdbId: number, mediaType: MediaType) => {
    const filtered = userTitles.filter(
      (t) => !(t.tmdb_id === tmdbId && t.media_type === mediaType)
    );
    persistTitles(filtered);
    toast.info('Title removed from tracker');
  };

  const importTitles = (newTitles: UserTitle[]) => {
    const map = new Map<string, UserTitle>();
    for (const t of userTitles) {
      map.set(`${t.tmdb_id}-${t.media_type}`, t);
    }
    for (const t of newTitles) {
      map.set(`${t.tmdb_id}-${t.media_type}`, t);
    }
    const merged = Array.from(map.values());
    persistTitles(merged);
    toast.success(`Imported ${newTitles.length} titles seamlessly`);
  };

  const nowWatchingTitles = userTitles.filter(
    (t) => t.status === 'watching' && t.media_type === 'tv'
  );

  const watchlistTitles = userTitles.filter((t) => t.status === 'want_to_watch');

  const diaryTitles = userTitles
    .filter((t) => t.status === 'watched')
    .sort((a, b) => {
      const dateA = a.watched_on || a.updated_at;
      const dateB = b.watched_on || b.updated_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

  return (
    <MediaContext.Provider
      value={{
        userTitles,
        catalog,
        activeFilter,
        setActiveFilter,
        searchQuery,
        setSearchQuery,
        quickLogItem,
        openQuickLog,
        closeQuickLog,
        saveLog,
        updateStatus,
        removeTitle,
        nowWatchingTitles,
        watchlistTitles,
        diaryTitles,
        importTitles,
        getUserTitle,
        subscribedServices,
        toggleSubscribedService,
        setSubscribedServices,
        isServiceSubscribed,
        isItemOnMyServices,
        isServicesModalOpen,
        openServicesModal: () => setIsServicesModalOpen(true),
        closeServicesModal: () => setIsServicesModalOpen(false),
      }}
    >
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
}
