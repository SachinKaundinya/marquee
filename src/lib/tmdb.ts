import { MediaItem, MediaType, UserTitle } from '@/types/media';
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
      const rawResults = (data.results || [])
        .filter(
          (item: any) =>
            (item.media_type === 'movie' || item.media_type === 'tv') &&
            Boolean(item.poster_path)
        )
        .slice(0, 10);

      const enriched = await Promise.all(
        rawResults.map(async (item: any) => {
          const formatted = formatTmdbItem(item);
          try {
            const credUrl = `${TMDB_BASE_URL}/${item.media_type}/${item.id}/credits`;
            const finalCredUrl = token ? credUrl : `${credUrl}?api_key=${key}`;
            const credRes = await fetch(finalCredUrl, { headers });
            if (credRes.ok) {
              const credData = await credRes.json();
              const topCast = (credData.cast || [])
                .slice(0, 3)
                .map((c: any) => c.name)
                .filter(Boolean);
              if (topCast.length > 0) {
                formatted.stars = topCast;
              }
            }
          } catch {
            // ignore
          }
          return formatted;
        })
      );

      if (enriched.length > 0) return enriched;
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

export function isAnimeItem(item: any): boolean {
  if (!item) return false;
  const origLang = (item.original_language || '').toLowerCase();
  const genres = (item.genres || []).map((g: string) => (typeof g === 'string' ? g.toLowerCase() : ''));
  const genreIds: number[] = Array.isArray(item.genre_ids) ? item.genre_ids : [];
  const isAnimation =
    genres.includes('animation') ||
    genres.includes('anime') ||
    genreIds.includes(16);

  if (isAnimation && origLang === 'ja') return true;

  const originCountry = Array.isArray(item.origin_country)
    ? item.origin_country
    : [];
  if (isAnimation && originCountry.includes('JP')) return true;

  const title = (item.title || item.name || '').toLowerCase();
  const overview = (item.overview || '').toLowerCase();
  if (
    title.includes('anime') ||
    overview.includes('anime series') ||
    overview.includes('anime television') ||
    overview.includes('manga series') ||
    overview.includes('based on the manga') ||
    overview.includes('based on manga')
  ) {
    return true;
  }

  return false;
}

export type TmdbCategory =
  | 'taste_match'
  | 'trending'
  | 'popular_movies'
  | 'popular_tv'
  | 'top_rated'
  | 'now_playing';

export async function fetchTrueCrimeTitles(page = 1): Promise<MediaItem[]> {
  const { token, key } = getTmdbCredentials();
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : {};

  try {
    const movieUrl = `${TMDB_BASE_URL}/discover/movie?with_keywords=33722&sort_by=vote_average.desc&vote_count.gte=30&page=${page}`;
    const tvUrl = `${TMDB_BASE_URL}/discover/tv?with_genres=80,99&sort_by=vote_average.desc&vote_count.gte=30&page=${page}`;

    const [mRes, tvRes] = await Promise.all([
      fetch(token ? movieUrl : `${movieUrl}&api_key=${key}`, { headers }),
      fetch(token ? tvUrl : `${tvUrl}&api_key=${key}`, { headers }),
    ]);

    const results: MediaItem[] = [];
    if (mRes.ok) {
      const data = await mRes.json();
      (data.results || []).forEach((item: any) => {
        if (!item.poster_path || isAnimeItem(item)) return;
        item.media_type = 'movie';
        const formatted = formatTmdbItem(item);
        if (!formatted.genres.includes('True Crime')) {
          formatted.genres.push('True Crime');
        }
        results.push(formatted);
      });
    }
    if (tvRes.ok) {
      const data = await tvRes.json();
      (data.results || []).forEach((item: any) => {
        if (!item.poster_path || isAnimeItem(item)) return;
        item.media_type = 'tv';
        const formatted = formatTmdbItem(item);
        if (!formatted.genres.includes('True Crime')) {
          formatted.genres.push('True Crime');
        }
        results.push(formatted);
      });
    }
    return results;
  } catch (err) {
    console.error('Failed to fetch True Crime titles', err);
    return [];
  }
}

export async function fetchTasteMatchRecommendations(
  userTitles: UserTitle[],
  page = 1
): Promise<MediaItem[]> {
  const { token, key } = getTmdbCredentials();
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : {};

  // If user has no logged titles yet, fallback to top-rated
  if (!userTitles || userTitles.length === 0) {
    return fetchTmdbCategory('top_rated', page);
  }

  const validUserTitles = userTitles.filter(
    (t) => t.status === 'watched' || t.status === 'want_to_watch' || t.status === 'watching'
  );

  const existingIds = new Set(validUserTitles.map((t) => `${t.media_type}-${t.tmdb_id}`));

  const movieSeeds = validUserTitles.filter((t) => t.media_type === 'movie');
  const tvSeeds = validUserTitles.filter((t) => t.media_type === 'tv');

  const startIndex = ((page - 1) * 3) % Math.max(1, validUserTitles.length);
  const selectedSeeds: UserTitle[] = [];

  for (let i = 0; i < 3 && movieSeeds.length > 0; i++) {
    const idx = (startIndex + i) % movieSeeds.length;
    selectedSeeds.push(movieSeeds[idx]);
  }
  for (let i = 0; i < 2 && tvSeeds.length > 0; i++) {
    const idx = (startIndex + i) % tvSeeds.length;
    selectedSeeds.push(tvSeeds[idx]);
  }

  try {
    const recPromises = selectedSeeds.map(async (seed) => {
      const endpoint = `/${seed.media_type}/${seed.tmdb_id}/recommendations?page=1`;
      const url = `${TMDB_BASE_URL}${endpoint}`;
      const finalUrl = token ? url : `${url}&api_key=${key}`;
      const res = await fetch(finalUrl, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || [])
        .filter((item: any) => Boolean(item.poster_path))
        .filter((item: any) => !isAnimeItem(item))
        .map((item: any) => {
          if (!item.media_type) {
            item.media_type = seed.media_type;
          }
          return formatTmdbItem(item);
        });
    });

    const settled = await Promise.all(recPromises);
    const combined = settled.flat();

    const map = new Map<number, MediaItem>();
    combined.forEach((item) => {
      const keyStr = `${item.media_type}-${item.tmdb_id}`;
      if (!existingIds.has(keyStr) && !map.has(item.tmdb_id)) {
        map.set(item.tmdb_id, item);
      }
    });

    if (map.size > 0) {
      return Array.from(map.values());
    }
  } catch (err) {
    console.error('Failed to fetch Taste Match recommendations', err);
  }

  return fetchTmdbCategory('top_rated', page);
}

export async function fetchTmdbCategory(
  category: TmdbCategory,
  page = 1,
  userTitles?: UserTitle[]
): Promise<MediaItem[]> {
  if (category === 'taste_match') {
    return fetchTasteMatchRecommendations(userTitles || [], page);
  }

  const { token, key } = getTmdbCredentials();
  let endpoint = '/trending/all/week';
  let defaultType: MediaType = 'movie';

  switch (category) {
    case 'trending':
      endpoint = '/trending/all/week';
      break;
    case 'popular_movies':
      endpoint = '/movie/popular';
      defaultType = 'movie';
      break;
    case 'popular_tv':
      endpoint = '/discover/tv?sort_by=popularity.desc&without_genres=10763,10764,10767,10766&vote_count.gte=50';
      defaultType = 'tv';
      break;
    case 'top_rated':
      endpoint = '/movie/top_rated';
      defaultType = 'movie';
      break;
    case 'now_playing':
      endpoint = '/movie/now_playing';
      defaultType = 'movie';
      break;
  }

  try {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${TMDB_BASE_URL}${endpoint}${separator}page=${page}`;
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : {};
    const finalUrl = token ? url : `${url}&api_key=${key}`;
    const res = await fetch(finalUrl, { headers });

    if (res.ok) {
      const data = await res.json();
      return (data.results || [])
        .filter((item: any) => Boolean(item.poster_path))
        .filter((item: any) => !isAnimeItem(item))
        .filter((item: any) => {
          if (category === 'popular_tv') {
            const genreIds: number[] = item.genre_ids || [];
            // Remove Reality (10764), Talk (10767), News (10763), Soap (10766)
            if (genreIds.some((id) => [10763, 10764, 10767, 10766].includes(id))) return false;
            const name = (item.name || item.title || '').toLowerCase();
            const disallowed = [
              'late night',
              'tonight show',
              'jimmy kimmel',
              'daily show',
              'survivor',
              'big brother',
              'love island',
              'the voice',
              'rupaul',
              'bachelor',
              'bachelorette',
              'real housewives',
            ];
            if (disallowed.some((d) => name.includes(d))) return false;
          }
          return true;
        })
        .map((item: any) => {
          if (!item.media_type) {
            item.media_type = defaultType;
          }
          return formatTmdbItem(item);
        });
    }
  } catch (err) {
    console.error('Failed to fetch TMDb category', category, err);
  }
  return [];
}

export async function getTrendingTitles(): Promise<MediaItem[]> {
  const titles = await fetchTmdbCategory('trending', 1);
  return titles.length > 0 ? titles : MOCK_CATALOG;
}

export async function getInitialDeepCatalog(): Promise<MediaItem[]> {
  // Fetch multiple diverse categories in parallel including True Crime
  try {
    const [t1, t2, popM, popTv, topM1, topM2, tc1, tc2] = await Promise.all([
      fetchTmdbCategory('trending', 1),
      fetchTmdbCategory('trending', 2),
      fetchTmdbCategory('popular_movies', 1),
      fetchTmdbCategory('popular_tv', 1),
      fetchTmdbCategory('top_rated', 1),
      fetchTmdbCategory('top_rated', 2),
      fetchTrueCrimeTitles(1),
      fetchTrueCrimeTitles(2),
    ]);

    const map = new Map<number, MediaItem>();
    [...t1, ...t2, ...popM, ...popTv, ...topM1, ...topM2, ...tc1, ...tc2].forEach((item) => {
      if (!isAnimeItem(item)) {
        map.set(item.tmdb_id, item);
      }
    });

    if (map.size > 0) {
      return Array.from(map.values());
    }
  } catch {
    //
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
  10759: 'Action',
  10762: 'Family',
  10763: 'News',
  10764: 'Reality-TV',
  10765: 'Sci-Fi',
  10766: 'Drama',
  10767: 'Talk-Show',
  10768: 'War',
};

const SHOW_NETWORK_MAP: Record<string, string> = {
  // Apple TV+
  'slow horses': 'Apple TV+',
  'severance': 'Apple TV+',
  'ted lasso': 'Apple TV+',
  'foundation': 'Apple TV+',
  'silo': 'Apple TV+',
  'the morning show': 'Apple TV+',
  'shrinking': 'Apple TV+',
  'bad sisters': 'Apple TV+',
  'for all mankind': 'Apple TV+',
  'black bird': 'Apple TV+',
  'presumed innocent': 'Apple TV+',
  'pachinko': 'Apple TV+',
  'masters of the air': 'Apple TV+',

  // Max / HBO
  'succession': 'Max',
  'the white lotus': 'Max',
  'the last of us': 'Max',
  'house of the dragon': 'Max',
  'game of thrones': 'Max',
  'euphoria': 'Max',
  'the sopranos': 'Max',
  'the wire': 'Max',
  'barry': 'Max',
  'true detective': 'Max',
  'chernobyl': 'Max',
  'hacks': 'Max',
  'curb your enthusiasm': 'Max',
  'industry': 'Max',
  'the penguin': 'Max',
  'dune: prophecy': 'Max',

  // Netflix
  'stranger things': 'Netflix',
  'breaking bad': 'Netflix',
  'better call saul': 'Netflix',
  'squid game': 'Netflix',
  'the crown': 'Netflix',
  'wednesday': 'Netflix',
  'black mirror': 'Netflix',
  'ozark': 'Netflix',
  'mindhunter': 'Netflix',
  'dark': 'Netflix',
  'beef': 'Netflix',
  'peaky blinders': 'Netflix',
  "the queen's gambit": 'Netflix',
  'bridgerton': 'Netflix',
  'narcos': 'Netflix',
  'baby reindeer': 'Netflix',
  'the diplomat': 'Netflix',
  'one piece': 'Netflix',
  'cobra kai': 'Netflix',
  'monsters': 'Netflix',
  'rip': 'Netflix',
  'supernatural': 'Netflix',
  'grey\'s anatomy': 'Netflix',
  'ncis': 'Netflix',

  // Hulu / FX
  'the bear': 'Hulu',
  'shogun': 'Hulu',
  'only murders in the building': 'Hulu',
  'fargo': 'Hulu',
  'what we do in the shadows': 'Hulu',
  'dopesick': 'Hulu',
  "the handmaid's tale": 'Hulu',
  'say nothing': 'Hulu',
  "it's always sunny in philadelphia": 'Hulu',
  'reservation dogs': 'Hulu',
  'the americans': 'Hulu',
  'justified': 'Hulu',
  'fleishman is in trouble': 'Hulu',
  'the rookie': 'Hulu',
  'criminal minds': 'Hulu',
  'family guy': 'Hulu',
  'the simpsons': 'Disney+',

  // Prime Video
  'reacher': 'Prime Video',
  'the boys': 'Prime Video',
  'fallout': 'Prime Video',
  'the lord of the rings: the rings of power': 'Prime Video',
  'invincible': 'Prime Video',
  'fleabag': 'Prime Video',
  'the wheel of time': 'Prime Video',
  'mr. & mrs. smith': 'Prime Video',
  "tom clancy's jack ryan": 'Prime Video',
  'bosch': 'Prime Video',
  'the expanse': 'Prime Video',
  'good omens': 'Prime Video',

  // Disney+
  'the mandalorian': 'Disney+',
  'andor': 'Disney+',
  'loki': 'Disney+',
  'wandavision': 'Disney+',
  'daredevil: born again': 'Disney+',
  'star wars: the bad batch': 'Disney+',
  'star wars: the clone wars': 'Disney+',
  "x-men '97": 'Disney+',
  'percy jackson and the olympians': 'Disney+',

  // Peacock
  'the office': 'Peacock',
  'parks and recreation': 'Peacock',
  'poker face': 'Peacock',
  'yellowstone': 'Peacock',
  'battlestar galactica': 'Peacock',
  'columbo': 'Peacock',
  'ted': 'Peacock',
  'brooklyn nine-nine': 'Peacock',
  'law & order: special victims unit': 'Peacock',
  'law & order': 'Peacock',

  // Paramount+
  'yellowjackets': 'Paramount+',
  'tulsa king': 'Paramount+',
  'mayor of kingstown': 'Paramount+',
  'star trek: strange new worlds': 'Paramount+',
  '1883': 'Paramount+',
  '1923': 'Paramount+',
  'lioness': 'Paramount+',
  'landman': 'Paramount+',
  'twin peaks': 'Paramount+',
  'the good fight': 'Paramount+',
  'the mentalist': 'Max',
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

  const rawTitle = isMovie ? item.title : item.name;
  const titleKey = (rawTitle || '').toLowerCase().trim();
  const matchedNetwork = SHOW_NETWORK_MAP[titleKey];

  // Auto-detect and tag True Crime
  const overviewText = (item.overview || '').toLowerCase();
  const isTrueCrime =
    (genres.includes('Crime') && genres.includes('Documentary')) ||
    (genres.includes('Crime') && (
      overviewText.includes('true story') ||
      overviewText.includes('real-life') ||
      overviewText.includes('serial killer') ||
      overviewText.includes('true crime') ||
      overviewText.includes('murder investigation')
    )) ||
    (Array.isArray(item.genre_ids) && item.genre_ids.includes(80) && item.genre_ids.includes(99));

  if (isTrueCrime && !genres.includes('True Crime')) {
    genres.push('True Crime');
  }

  // Predictable deterministic provider fallback based on title hash if not in lookup
  const providerIndex = Math.abs(item.id) % POPULAR_NETWORKS.length;
  const defaultProvider = matchedNetwork || POPULAR_NETWORKS[providerIndex];

  return {
    id: item.id,
    tmdb_id: item.id,
    title: rawTitle,
    media_type: isMovie ? 'movie' : 'tv',
    poster_path: item.poster_path
      ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}`
      : '',
    backdrop_path: item.backdrop_path
      ? `${TMDB_IMAGE_BASE}/w1280${item.backdrop_path}`
      : undefined,
    release_year: year || 2024,
    vote_average: Number((item.vote_average || 0).toFixed(1)),
    genres: genres.length > 0 ? genres : ['Drama'],
    overview: item.overview,
    streaming_sources: [defaultProvider],
    primary_source: defaultProvider,
  };
}
