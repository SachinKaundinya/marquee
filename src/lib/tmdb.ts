import { MediaItem, MediaType } from '@/types/media';
import { MOCK_CATALOG, POPULAR_PROVIDERS } from '@/data/mockCatalog';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export async function searchTitles(query: string): Promise<MediaItem[]> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY;

  if (!query.trim()) {
    return MOCK_CATALOG;
  }

  // If API key is present, attempt live TMDb search
  if (apiKey) {
    try {
      const res = await fetch(
        `${TMDB_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data = await res.json();
        return (data.results || [])
          .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
          .slice(0, 12)
          .map((item: any) => formatTmdbItem(item));
      }
    } catch {
      // Fallback on network error or offline
    }
  }

  // Fallback to local curated catalog fuzzy match
  const q = query.toLowerCase();
  return MOCK_CATALOG.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.genres.some((g) => g.toLowerCase().includes(q))
  );
}

export async function getTrendingTitles(): Promise<MediaItem[]> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch(
        `${TMDB_BASE_URL}/trending/all/day?api_key=${apiKey}`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data = await res.json();
        return (data.results || [])
          .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
          .slice(0, 15)
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

  // Pseudo provider assignment for instant availability badging demonstration
  const providers = [
    POPULAR_PROVIDERS.apple,
    POPULAR_PROVIDERS.max,
    POPULAR_PROVIDERS.netflix,
    POPULAR_PROVIDERS.hulu,
    POPULAR_PROVIDERS.criterion,
  ];
  const provider = providers[item.id % providers.length];

  return {
    id: item.id,
    tmdb_id: item.id,
    title: isMovie ? item.title : item.name,
    media_type: isMovie ? 'movie' : 'tv',
    poster_path: item.poster_path
      ? `${TMDB_IMAGE_BASE}/w780${item.poster_path}`
      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=780&auto=format&fit=crop&q=80',
    backdrop_path: item.backdrop_path
      ? `${TMDB_IMAGE_BASE}/w1280${item.backdrop_path}`
      : undefined,
    release_year: year || 2024,
    vote_average: Number((item.vote_average || 0).toFixed(1)),
    genres: ['Featured'],
    overview: item.overview,
    streaming_provider: provider,
  };
}
