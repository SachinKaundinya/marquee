'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserTitle, MediaItem, QuickLogInput, TrackingStatus, MediaType } from '@/types/media';
import { INITIAL_USER_TITLES, MOCK_CATALOG } from '@/data/mockCatalog';
import { toast } from 'sonner';
import { getInitialDeepCatalog, fetchTmdbCategory, TmdbCategory } from '@/lib/tmdb';
import { useAuth } from '@/context/AuthContext';
import { SACHIN_PERSONAL_TITLES } from '@/data/sachinPersonalTitles';
import { getImdbRating } from '@/lib/imdbRatings';

export const ALL_SERVICES = [
  'Apple TV+',
  'Max',
  'Netflix',
  'Hulu',
  'Prime Video',
  'Prime Video (Rent)',
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
  
  markNotInterested: (tmdbId: number, mediaType: MediaType) => void;

  // Catalog Category & Pagination
  selectedCategory: TmdbCategory;
  changeCategory: (category: TmdbCategory) => void;
  loadMoreCatalog: () => Promise<void>;
  isCatalogLoading: boolean;

  // Subscribed Services Management
  subscribedServices: string[];
  toggleSubscribedService: (serviceName: string) => void;
  setSubscribedServices: (services: string[]) => void;
  isServiceSubscribed: (serviceName: string) => boolean;
  isItemOnMyServices: (item: MediaItem) => boolean;
  isServicesModalOpen: boolean;
  openServicesModal: () => void;
  closeServicesModal: () => void;

  // Search Focus Trigger
  searchFocusTrigger: number;
  searchFocusContext?: 'diary' | 'watchlist';
  triggerSearchFocus: (context?: 'diary' | 'watchlist') => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

const SUBS_STORAGE_KEY = 'marquee_user_subscriptions_v3';
const HIDDEN_STORAGE_KEY = 'marquee_hidden_titles_v1';

function getUserStorageKey(email?: string | null): string {
  if (!email) return 'mirar_user_titles_guest';
  const sanitized = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `mirar_user_titles_${sanitized}`;
}

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();

  // Start completely clean: no random hardcoded titles
  const [userTitles, setUserTitles] = useState<UserTitle[]>([]);
  const [catalog, setCatalog] = useState<MediaItem[]>([]);
  const [hiddenTitleKeys, setHiddenTitleKeys] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickLogItem, setQuickLogItem] = useState<{ item: MediaItem; initialStatus?: TrackingStatus } | null>(null);

  // Catalog category & pagination
  const [selectedCategory, setSelectedCategory] = useState<TmdbCategory>('trending');
  const [categoryPages, setCategoryPages] = useState<Record<string, number>>({ trending: 1 });
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  
  // Default subscribed services
  const [subscribedServices, setSubscribedServicesState] = useState<string[]>([
    'Apple TV+',
    'Max',
    'Netflix',
    'Prime Video',
  ]);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);

  // Search Focus Trigger State
  const [searchFocusTrigger, setSearchFocusTrigger] = useState<number>(0);
  const [searchFocusContext, setSearchFocusContext] = useState<'diary' | 'watchlist' | undefined>();

  const triggerSearchFocus = (context?: 'diary' | 'watchlist') => {
    setSearchFocusContext(context);
    setSearchFocusTrigger((prev) => prev + 1);
  };

  // Hydrate user-specific titles from localStorage (isolated per user profile)
  useEffect(() => {
    if (isAuthLoading) return;

    const email = user?.email?.toLowerCase();
    const currentKey = getUserStorageKey(email);
    const isSachin = email === 'sachin.bhattiprolu@gmail.com';

    let localHidden: string[] = [];
    try {
      const storedHidden = localStorage.getItem(HIDDEN_STORAGE_KEY);
      if (storedHidden) {
        const parsed = JSON.parse(storedHidden);
        if (Array.isArray(parsed)) {
          localHidden = parsed;
          setHiddenTitleKeys(parsed);
        }
      }
    } catch {
      //
    }

    try {
      const stored = localStorage.getItem(currentKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validTitles = parsed
            .filter(
              (t: any) =>
                !t.id?.startsWith('user-title-') &&
                !localHidden.includes(`${t.media_type}-${t.tmdb_id}`)
            )
            .map((t: any) => {
              if (t.media?.poster_path && t.media.poster_path.startsWith('/') && !t.media.poster_path.startsWith('http')) {
                t.media.poster_path = `https://image.tmdb.org/t/p/w500${t.media.poster_path}`;
              }
              if (t.media?.backdrop_path && t.media.backdrop_path.startsWith('/') && !t.media.backdrop_path.startsWith('http')) {
                t.media.backdrop_path = `https://image.tmdb.org/t/p/w1280${t.media.backdrop_path}`;
              }
              if (t.media_type === 'movie' && t.media) {
                const s = t.media.streaming_sources || [];
                if (!s.includes('Prime Video (Rent)')) {
                  t.media.streaming_sources = [...s, 'Prime Video (Rent)'];
                }
              }

              // Auto-heal verified IMDb scores and provider discrepancies
              if (t.media) {
                const imdbRating = getImdbRating(t.media.title, t.tmdb_id);
                if (imdbRating !== undefined) {
                  t.media.vote_average = imdbRating;
                }
                const titleLower = (t.media.title || '').toLowerCase().trim();
                if (titleLower === 'you can see everything' || t.tmdb_id === 1765072) {
                  t.media.vote_average = 9.3;
                  t.media.primary_source = 'In Theaters';
                  t.media.streaming_sources = ['In Theaters'];
                }
              }

              return t;
            });

          setUserTitles(validTitles);
          // Sync normalized image URLs to localStorage
          localStorage.setItem(currentKey, JSON.stringify(validTitles));
          return;
        }
      }

      // If user profile has no stored titles yet:
      if (isSachin) {
        // Seed Sachin's personal list from iCloud notes checklist!
        setUserTitles(SACHIN_PERSONAL_TITLES);
        localStorage.setItem(currentKey, JSON.stringify(SACHIN_PERSONAL_TITLES));
      } else {
        // Any other user or guest gets a clean, empty list
        setUserTitles([]);
      }
    } catch {
      if (isSachin) {
        setUserTitles(SACHIN_PERSONAL_TITLES);
      } else {
        setUserTitles([]);
      }
    }
  }, [user?.email, isAuthLoading]);

  // Deep Catalog & Subscriptions Initialization
  useEffect(() => {
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

    setIsCatalogLoading(true);
    getInitialDeepCatalog()
      .then((deepTitles) => {
        if (deepTitles && deepTitles.length > 0) {
          setCatalog(deepTitles);
        }
      })
      .finally(() => {
        setIsCatalogLoading(false);
      });
  }, []);

  const markNotInterested = (tmdbId: number, mediaType: MediaType) => {
    const key = `${mediaType}-${tmdbId}`;
    const updatedHidden = [...hiddenTitleKeys, key];
    setHiddenTitleKeys(updatedHidden);
    try {
      localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(updatedHidden));
    } catch {
      //
    }

    // Remove from active catalog
    setCatalog((prev) =>
      prev.filter((c) => !(c.tmdb_id === tmdbId && c.media_type === mediaType))
    );

    // Remove from user watchlist/shelf if present
    const updatedUserTitles = userTitles.filter(
      (t) => !(t.tmdb_id === tmdbId && t.media_type === mediaType)
    );
    persistTitles(updatedUserTitles);

    closeQuickLog();

    toast.info('Removed from Feed', {
      description: 'Marked as Not Interested',
    });
  };

  const changeCategory = async (category: TmdbCategory) => {
    setSelectedCategory(category);
    setIsCatalogLoading(true);
    try {
      const titles = await fetchTmdbCategory(category, 1, userTitles);
      setCategoryPages((prev) => ({ ...prev, [category]: 1 }));
      if (titles && titles.length > 0) {
        const visible = titles.filter(
          (t) => !hiddenTitleKeys.includes(`${t.media_type}-${t.tmdb_id}`)
        );
        setCatalog(visible);
      }
    } finally {
      setIsCatalogLoading(false);
    }
  };

  const loadMoreCatalog = async () => {
    if (isCatalogLoading) return;
    const nextPage = (categoryPages[selectedCategory] || 1) + 1;
    setIsCatalogLoading(true);

    try {
      const moreTitles = await fetchTmdbCategory(selectedCategory, nextPage, userTitles);
      if (moreTitles && moreTitles.length > 0) {
        setCategoryPages((prev) => ({ ...prev, [selectedCategory]: nextPage }));
        setCatalog((prev) => {
          const map = new Map<number, MediaItem>();
          prev.forEach((item) => map.set(item.tmdb_id, item));
          moreTitles.forEach((item) => {
            const key = `${item.media_type}-${item.tmdb_id}`;
            if (!map.has(item.tmdb_id) && !hiddenTitleKeys.includes(key)) {
              map.set(item.tmdb_id, item);
            }
          });
          return Array.from(map.values());
        });
        toast.success(`Loaded ${moreTitles.length} more titles from TMDb`);
      }
    } catch {
      toast.error('Failed to load more titles from TMDb');
    } finally {
      setIsCatalogLoading(false);
    }
  };

  // Sync titles to localStorage (scoped to the active authenticated user profile)
  const persistTitles = (titles: UserTitle[]) => {
    setUserTitles(titles);
    try {
      const key = getUserStorageKey(user?.email);
      localStorage.setItem(key, JSON.stringify(titles));
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
    if (item.media_type === 'movie' && subscribedServices.includes('Prime Video (Rent)')) {
      return true;
    }
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
        user_id: user?.email || 'local-user',
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
        user_id: user?.email || 'local-user',
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
        markNotInterested,
        selectedCategory,
        changeCategory,
        loadMoreCatalog,
        isCatalogLoading,
        subscribedServices,
        toggleSubscribedService,
        setSubscribedServices,
        isServiceSubscribed,
        isItemOnMyServices,
        isServicesModalOpen,
        openServicesModal: () => setIsServicesModalOpen(true),
        closeServicesModal: () => setIsServicesModalOpen(false),
        searchFocusTrigger,
        searchFocusContext,
        triggerSearchFocus,
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
