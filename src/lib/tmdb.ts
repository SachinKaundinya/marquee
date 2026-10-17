import { MediaItem } from '@/types/media';
import { MOCK_CATALOG } from '@/data/mockCatalog';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

function getApiKey(): string | null {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('marquee_tmdb_key');
    if (localKey && localKey.trim()) return localKey.trim();
  }
  return process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY || null;
}

export async function searchTitles(query: string): Promise<MediaItem[]> {
  const apiKey = getApiKey();

  if (!query.trim()) {
    return MOCK_CATALOG;
  }

  // If API key is present, execute live TMDb search
  if (apiKey) {
    try {
      const isBearer = apiKey.length > 40;
      const url = `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&include_adult=false${
        isBearer ? '' : `&api_key=${apiKey}`
      }`;
      const headers: Record<string, string> = isBearer
        ? { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        : {};

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const results = (data.results || [])
          .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
          .slice(0, 16)
          .map((item: any) => formatTmdbItem(item));

        if (results.length > 0) return results;
      }
    } catch {
      // Fallback
    }
  }

  // Fallback to local catalog fuzzy match
  const q = query.toLowerCase();
  return MOCK_CATALOG.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.genres.some((g) => g.toLowerCase().includes(q))
  );
}

export async function getTrendingTitles(): Promise<MediaItem[]> {
  const apiKey = getApiKey();

  if (apiKey) {
    try {
      const isBearer = apiKey.length > 40;
      const url = `${TMDB_BASE_URL}/trending/all/day${
        isBearer ? '' : `?api_key=${apiKey}`
      }`;
      const headers: Record<string, string> = isBearer
        ? { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        : {};

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        return (data.results || [])
          .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
          .slice(0, 24)
          .map((item: any) => formatTmdbItem(item));
      }
    } catch {
      // Fallback
    }
  }

  return MOCK_CATALOG;
}

function formatTmdbItem(item: any): MediaItem {
  const isMovie = item.media_type === 'movie' || Boolean(item.title);
  const releaseDate = isMovie ? item.release_date : item.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();

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
    genres: ['Featured'],
    overview: item.overview,
  };
}
