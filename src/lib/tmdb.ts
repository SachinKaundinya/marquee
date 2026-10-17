import { MediaItem, MediaType } from '@/types/media';
import { MOCK_CATALOG } from '@/data/mockCatalog';
import { searchOmdb } from './omdb';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const DEFAULT_TMDB_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhN2M5MzQyY2EyOTVjOTFiYjc5YzY2OTBjNzBhOTJhNiIsIm5iZiI6MTc5MjE5NTA3Ny44NjQsInN1YiI6IjZhZDJiYTA1MzMyYThkM2QyNmE1YmYwMSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Ax8vx8tAFlGvg-PYcu-78HqsvthyG8S51AqD6TZwmNo';

const DEFAULT_TMDB_KEY = 'a7c9342ca295c91bb79c6690c70a92a6';

export function getTmdbCredentials() {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('marquee_tmdb_token');
    if (local && local.trim()) return { token: local.trim(), key: DEFAULT_TMDB_KEY };
  }
  const token =
    process.env.NEXT_PUBLIC_TMDB_READ_TOKEN ||
    process.env.TMDB_READ_TOKEN ||
    DEFAULT_TMDB_TOKEN;
  const key =
    process.env.NEXT_PUBLIC_TMDB_API_KEY ||
    process.env.TMDB_API_KEY ||
    DEFAULT_TMDB_KEY;
  return { token, key };
}

export function cleanProviderName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('netflix')) return 'Netflix';
  if (n.includes('apple')) return 'Apple TV+';
  if (n.includes('max') || n.includes('hbo')) return 'Max';
  if (n.includes('hulu')) return 'Hulu';
  if (n.includes('prime') || n.includes('amazon')) return 'Prime Video';
  if (n.includes('disney')) return 'Disney+';
  if (n.includes('peacock')) return 'Peacock';
  if (n.includes('paramount')) return 'Paramount+';
  if (n.includes('criterion')) return 'Criterion Channel';
  if (n.includes('mgm')) return 'MGM+';
  return name;
}

export async function fetchWatchProviders(mediaType: MediaType, id: number): Promise<string[]> {
  const { token, key } = getTmdbCredentials();
  try {
    const url = `${TMDB_BASE_URL}/${mediaType}/${id}/watch/providers`;
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};
    const finalUrl = token ? url : `${url}?api_key=${key}`;
    const res = await fetch(finalUrl, { headers });
    if (res.ok) {
      const data = await res.json();
      const us = data.results?.US;
      if (us?.flatrate && Array.isArray(us.flatrate)) {
        const cleaned = us.flatrate
          .map((p: any) => cleanProviderName(p.provider_name))
          .filter(Boolean);
        return Array.from(new Set(cleaned));
      }
    }
  } catch {
    //
  }
  return [];
}

export async function searchTitles(query: string): Promise<MediaItem[]> {
  if (!query.trim()) {
    return MOCK_CATALOG;
  }

  const { token, key } = getTmdbCredentials();

  // 1. Primary Live Multi-Search: TMDb
  try {
    const url = `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(
      query
    )}&include_adult=false`;
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : {};

    const finalUrl = token ? url : `${url}&api_key=${key}`;
    const res = await fetch(finalUrl, { headers });

    if (res.ok) {
      const data = await res.json();
      const results = (data.results || [])
        .filter(
          (item: any) =>
            (item.media_type === 'movie' || item.media_type === 'tv') &&
            Boolean(item.poster_path)
        )
        .slice(0, 18)
        .map((item: any) => formatTmdbItem(item));

      if (results.length > 0) return results;
    }
  } catch {
    // Fallback to OMDb on error
  }

  // 2. Secondary Search: OMDb (IMDb database)
  try {
    const omdbResults = await searchOmdb(query);
    if (omdbResults.length > 0) return omdbResults;
  } catch {
    // Fallback
  }

  // 3. Fallback to local catalog fuzzy match
  const q = query.toLowerCase();
  return MOCK_CATALOG.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.genres.some((g) => g.toLowerCase().includes(q))
  );
}

export async function getTrendingTitles(): Promise<MediaItem[]> {
  const { token, key } = getTmdbCredentials();

  try {
    const url = `${TMDB_BASE_URL}/trending/all/day`;
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : {};

    const finalUrl = token ? url : `${url}?api_key=${key}`;
    const res = await fetch(finalUrl, { headers });

    if (res.ok) {
      const data = await res.json();
      const trending = (data.results || [])
        .filter(
          (item: any) =>
            (item.media_type === 'movie' || item.media_type === 'tv') &&
            Boolean(item.poster_path)
        )
        .slice(0, 30)
        .map((item: any) => formatTmdbItem(item));

      if (trending.length > 0) return trending;
    }
  } catch {
    // Fallback
  }

  return MOCK_CATALOG;
}

const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

const POPULAR_NETWORKS = [
  'Max',
  'Netflix',
  'Apple TV+',
  'Hulu',
  'Prime Video',
  'Disney+',
  'Peacock',
  'Paramount+',
  'Criterion Channel',
];

function formatTmdbItem(item: any): MediaItem {
  const isMovie = item.media_type === 'movie' || Boolean(item.title);
  const releaseDate = isMovie ? item.release_date : item.first_air_date;
  const year = releaseDate
    ? new Date(releaseDate).getFullYear()
    : new Date().getFullYear();

  const genres = Array.isArray(item.genre_ids)
    ? item.genre_ids.map((id: number) => GENRE_MAP[id] || 'Film').filter(Boolean)
    : [isMovie ? 'Feature' : 'Series'];

  // Predictable deterministic provider fallback based on title hash if not yet fetched
  const providerIndex = Math.abs(item.id) % POPULAR_NETWORKS.length;
  const defaultProvider = POPULAR_NETWORKS[providerIndex];

  return {
    id: item.id,
    tmdb_id: item.id,
    title: isMovie ? item.title : item.name,
    media_type: isMovie ? 'movie' : 'tv',
    poster_path: item.poster_path
      ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}`
      : '',
    backdrop_path: item.backdrop_path
      ? `${TMDB_IMAGE_BASE}/w1280${item.backdrop_path}`
      : undefined,
    release_year: year || 2024,
    vote_average: Number((item.vote_average || 0).toFixed(1)),
    genres: genres.length > 0 ? genres.slice(0, 3) : ['Drama'],
    overview: item.overview,
    streaming_sources: [defaultProvider],
    primary_source: defaultProvider,
  };
}
