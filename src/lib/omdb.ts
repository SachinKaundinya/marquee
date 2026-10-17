import { MediaItem, MediaType } from '@/types/media';

const DEFAULT_OMDB_KEY = '44535897';
const OMDB_BASE_URL = 'https://www.omdbapi.com';

export function getOmdbKey(): string {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('marquee_omdb_key');
    if (local && local.trim()) return local.trim();
  }
  return process.env.NEXT_PUBLIC_OMDB_API_KEY || process.env.OMDB_API_KEY || DEFAULT_OMDB_KEY;
}

// Convert IMDb ID string (e.g. tt11280740) into a consistent numeric ID
export function imdbIdToNumeric(imdbId: string): number {
  if (!imdbId) return Math.floor(Math.random() * 1000000);
  const digits = imdbId.replace(/\D/g, '');
  if (digits) {
    const num = parseInt(digits.slice(0, 8), 10);
    if (!isNaN(num)) return num;
  }
  let hash = 0;
  for (let i = 0; i < imdbId.length; i++) {
    hash = (hash << 5) - hash + imdbId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function searchOmdb(query: string): Promise<MediaItem[]> {
  const apiKey = getOmdbKey();
  if (!query.trim()) return [];

  try {
    const res = await fetch(
      `${OMDB_BASE_URL}/?s=${encodeURIComponent(query)}&apikey=${apiKey}`
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (data.Response === 'True' && Array.isArray(data.Search)) {
      return data.Search.map((item: any) => formatOmdbItem(item));
    }
  } catch {
    // Network or parse error
  }
  return [];
}

export async function getOmdbDetails(titleOrId: string): Promise<MediaItem | null> {
  const apiKey = getOmdbKey();
  const param = titleOrId.startsWith('tt')
    ? `i=${encodeURIComponent(titleOrId)}`
    : `t=${encodeURIComponent(titleOrId)}`;

  try {
    const res = await fetch(`${OMDB_BASE_URL}/?${param}&apikey=${apiKey}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.Response === 'True') {
      return formatOmdbItem(data);
    }
  } catch {
    // Error
  }
  return null;
}

function formatOmdbItem(item: any): MediaItem {
  const isSeries = item.Type === 'series';
  const mediaType: MediaType = isSeries ? 'tv' : 'movie';
  const rawYear = String(item.Year || '').replace(/[^\d]/g, '').slice(0, 4);
  const year = rawYear ? parseInt(rawYear, 10) : new Date().getFullYear();
  const numericId = imdbIdToNumeric(item.imdbID || item.Title);

  const poster =
    item.Poster && item.Poster !== 'N/A' && item.Poster.startsWith('http')
      ? item.Poster
      : '';

  const rating = item.imdbRating && item.imdbRating !== 'N/A'
    ? parseFloat(item.imdbRating)
    : 7.5;

  const runtimeStr = item.Runtime && item.Runtime !== 'N/A'
    ? String(item.Runtime).replace(/\D/g, '')
    : '';
  const runtime = runtimeStr ? parseInt(runtimeStr, 10) : undefined;

  const genres = item.Genre && item.Genre !== 'N/A'
    ? item.Genre.split(',').map((g: string) => g.trim())
    : [isSeries ? 'TV Series' : 'Feature'];

  return {
    id: numericId,
    tmdb_id: numericId,
    title: item.Title,
    media_type: mediaType,
    poster_path: poster,
    release_year: year,
    runtime,
    vote_average: Number(rating.toFixed(1)),
    genres,
    overview: item.Plot !== 'N/A' ? item.Plot : undefined,
    stars: item.Actors && item.Actors !== 'N/A'
      ? item.Actors.split(',').map((a: string) => a.trim()).filter(Boolean)
      : undefined,
  };
}
