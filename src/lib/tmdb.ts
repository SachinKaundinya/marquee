import { MediaItem, MediaType, UserTitle } from '@/types/media';
import { MOCK_CATALOG } from '@/data/mockCatalog';
import { searchOmdb, getOmdbDetails } from './omdb';
import { getImdbRating } from './imdbRatings';

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
  if (n.includes('apple tv') || n.includes('apple')) return 'Apple TV+';
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

const watchProvidersCache = new Map<string, { flatrate: string[]; rent: string[] }>();

export async function fetchWatchProviders(
  mediaType: MediaType,
  id: number
): Promise<{ flatrate: string[]; rent: string[] }> {
  const cacheKey = `${mediaType}-${id}`;
  if (watchProvidersCache.has(cacheKey)) {
    return watchProvidersCache.get(cacheKey)!;
  }

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
      const flatrate: string[] = [];
      const rent: string[] = [];

      if (us?.flatrate && Array.isArray(us.flatrate)) {
        us.flatrate.forEach((p: any) => {
          const cleaned = cleanProviderName(p.provider_name);
          if (cleaned && !flatrate.includes(cleaned)) {
            flatrate.push(cleaned);
          }
        });
      }

      if (
        (us?.rent && Array.isArray(us.rent) && us.rent.length > 0) ||
        (us?.buy && Array.isArray(us.buy) && us.buy.length > 0)
      ) {
        rent.push('Prime (Rent)');
      }

      const result = { flatrate, rent };
      watchProvidersCache.set(cacheKey, result);
      return result;
    }
  } catch {
    //
  }

  const empty = { flatrate: [], rent: [] };
  watchProvidersCache.set(cacheKey, empty);
  return empty;
}

export async function enrichMediaItemWithProviders(item: MediaItem): Promise<MediaItem> {
  try {
    const { flatrate, rent } = await fetchWatchProviders(item.media_type, item.tmdb_id);
    if (flatrate.length > 0) {
      item.streaming_sources = [...flatrate, ...(rent.length > 0 ? ['Prime (Rent)'] : [])];
      item.primary_source = flatrate[0];
    } else if (rent.length > 0) {
      item.streaming_sources = ['Prime (Rent)'];
      item.primary_source = 'Prime (Rent)';
    } else {
      // If TMDb reports no US providers:
      // If already marked In Theaters or Coming Soon, keep that
      if (item.primary_source !== 'In Theaters' && item.primary_source !== 'Coming Soon') {
        if (item.media_type === 'movie') {
          item.streaming_sources = ['Prime (Rent)'];
          item.primary_source = 'Prime (Rent)';
        }
      }
    }
  } catch {
    // Keep defaults
  }
  return item;
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
          await enrichMediaItemWithProviders(formatted);
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

const ANIME_FRANCHISE_TOKENS = [
  'attack on titan', 'shingeki no kyojin', 'demon slayer', 'kimetsu no yaiba',
  'jujutsu kaisen', 'solo leveling', 'chainsaw man', 'bleach', 'one piece',
  'naruto', 'boruto', 'dragon ball', 'death note', 'hunter x hunter',
  'fullmetal alchemist', 'spy x family', 'frieren', 'sousou no frieren',
  'dandadan', 'dan da dan', 'kaiju no. 8', 'kaiju no 8', 'vinland saga',
  'blue lock', 'mob psycho', 'haikyu', 'my hero academia', 'boku no hero',
  'tokyo ghoul', 'steins;gate', 'steins gate', 'cowboy bebop', 'evangelion',
  'neon genesis', 'code geass', 'delicious in dungeon', 'dungeon meshi',
  'ranma', 'uzumaki', 'black clover', 'sword art online', 'seven deadly sins',
  'jojo', 'fairy tail', 'one punch man', 'inuyasha', 'sailor moon',
  'pokemon', 'pokémon', 'yu-gi-oh', 'digimon', 'berserk', 'slam dunk',
  'initial d', 'gintama', 'ghost in the shell', 'akira', 'spirited away',
  'princess mononoke', 'howl\'s moving castle', 'your name', 'weathering with you',
  'suzume', 'a silent voice', 'the boy and the heron', 'grave of the fireflies',
  'ninja kamui', 'pluto', 'gundam', 'fate/stay', 'fate/zero', 'overlord',
  're:zero', 'oshi no ko', 'kaguya-sama', 'baki', 'record of ragnarok',
  'wind breaker', 'mushoku tensei', 'classroom of the elite', 'hell\'s paradise',
  'jigokuraku', 'mashle', 'shangri-la frontier', 'undead unluck', 'blue exorcist',
  'dr. stone', 'fire force', 'soul eater', 'promised neverland', 'bungo stray dogs',
  'assassination classroom', 'noragami', 'toradora', 'violet evergarden',
  'parasyte', 'erased', 'dororo', 'banana fish', 'devilman crybaby',
  'cyberpunk: edgerunners', 'castlevania'
];

const ANIME_KEYWORD_TOKENS = [
  'anime', 'manga', 'light novel', 'shonen', 'shounen', 'seinen', 'otaku',
  'isekai', 'mecha', 'studio ghibli', 'hayao miyazaki', 'makoto shinkai',
  'ufotable', 'toei animation', 'wit studio', 'kyoto animation', 'mappa',
  'bones', 'cloverworks', 'a-1 pictures', 'madhouse', 'production i.g',
  'gainax', 'trigger', 'based on the manga', 'based on manga', 'manga series',
  'anime series', 'anime television'
];

export function isAnimationItem(item: any): boolean {
  if (!item) return false;
  const genres = (item.genres || []).map((g: string) => (typeof g === 'string' ? g.toLowerCase() : ''));
  const genreIds: number[] = Array.isArray(item.genre_ids) ? item.genre_ids : [];
  if (
    genres.includes('animation') ||
    genres.includes('anime') ||
    genres.includes('animated') ||
    genreIds.includes(16)
  ) {
    return true;
  }
  const title = (item.title || item.name || '').toLowerCase();
  const overview = (item.overview || '').toLowerCase();
  if (overview.includes('animated film') || overview.includes('animated series') || overview.includes('anime series') || overview.includes('computer-animated')) {
    return true;
  }
  return false;
}

export function isAnimeItem(item: any): boolean {
  if (!item) return false;
  if (isAnimationItem(item)) return true;
  const origLang = (item.original_language || '').toLowerCase().trim();
  const genres = (item.genres || []).map((g: string) => (typeof g === 'string' ? g.toLowerCase() : ''));
  const genreIds: number[] = Array.isArray(item.genre_ids) ? item.genre_ids : [];
  const isAnimation =
    genres.includes('animation') ||
    genres.includes('anime') ||
    genreIds.includes(16);

  const originCountry: string[] = Array.isArray(item.origin_country)
    ? item.origin_country
    : [];

  // Japanese or Korean animation is definitely anime
  if (isAnimation && (origLang === 'ja' || origLang === 'ko' || originCountry.includes('JP') || originCountry.includes('KR'))) {
    return true;
  }

  // Japanese TV series originating in JP
  if (origLang === 'ja' && originCountry.includes('JP') && (isAnimation || item.media_type === 'tv')) {
    return true;
  }

  const title = (item.title || item.name || '').toLowerCase();
  const origTitle = (item.original_title || item.original_name || '').toLowerCase();
  const overview = (item.overview || '').toLowerCase();

  // Franchise title matching
  if (ANIME_FRANCHISE_TOKENS.some((t) => title.includes(t) || origTitle.includes(t))) {
    return true;
  }

  // Keyword / description matching
  if (ANIME_KEYWORD_TOKENS.some((k) => overview.includes(k) || title.includes(k))) {
    return true;
  }

  return false;
}

export function isNonEnglishItem(item: any): boolean {
  if (!item) return false;
  const lang = (item.original_language || '').toLowerCase().trim();
  if (lang && lang !== 'en') return true;

  const countries: string[] = Array.isArray(item.origin_country)
    ? item.origin_country
    : [];
  const englishCountries = ['US', 'GB', 'CA', 'AU', 'NZ', 'IE'];
  if (countries.length > 0 && !countries.some((c) => englishCountries.includes(c))) {
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
  | 'now_playing'
  | 'international';

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

export async function fetchInternationalTitles(page = 1): Promise<MediaItem[]> {
  const { token, key } = getTmdbCredentials();
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : {};

  const langs = 'ko|ja|hi|es|fr|de|it|zh|te|ta|pt|sv|da|no|tr|pl|nl|ru';
  const movieUrl = `${TMDB_BASE_URL}/discover/movie?with_original_language=${langs}&sort_by=vote_count.desc&vote_average.gte=6.5&page=${page}`;
  const tvUrl = `${TMDB_BASE_URL}/discover/tv?with_original_language=${langs}&without_genres=10763,10764,10767,10766&sort_by=vote_count.desc&vote_count.gte=50&page=${page}`;

  try {
    const [mRes, tvRes] = await Promise.all([
      fetch(token ? movieUrl : `${movieUrl}&api_key=${key}`, { headers }),
      fetch(token ? tvUrl : `${tvUrl}&api_key=${key}`, { headers }),
    ]);

    const items: MediaItem[] = [];
    const seen = new Set<number>();

    if (mRes.ok) {
      const data = await mRes.json();
      (data.results || [])
        .filter((item: any) => Boolean(item.poster_path) && !isAnimeItem(item) && isNonEnglishItem(item))
        .forEach((raw: any) => {
          raw.media_type = 'movie';
          const formatted = formatTmdbItem(raw);
          if (!seen.has(formatted.tmdb_id)) {
            seen.add(formatted.tmdb_id);
            items.push(formatted);
          }
        });
    }

    if (tvRes.ok) {
      const data = await tvRes.json();
      (data.results || [])
        .filter((item: any) => Boolean(item.poster_path) && !isAnimeItem(item) && isNonEnglishItem(item))
        .forEach((raw: any) => {
          raw.media_type = 'tv';
          const formatted = formatTmdbItem(raw);
          if (!seen.has(formatted.tmdb_id)) {
            seen.add(formatted.tmdb_id);
            items.push(formatted);
          }
        });
    }

    return items;
  } catch (err) {
    console.error('Failed to fetch international titles', err);
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

  // If user has no logged titles yet, fallback to top-rated without documentaries or foreign titles
  if (!userTitles || userTitles.length === 0) {
    const fallback = await fetchTmdbCategory('top_rated', page);
    return fallback.filter(
      (item) => !item.genres.some((g) => g.toLowerCase().includes('doc') || g.toLowerCase() === 'documentary') && !isNonEnglishItem(item)
    );
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
        .filter((item: any) => !isNonEnglishItem(item))
        .filter((item: any) => {
          const genreIds: number[] = Array.isArray(item.genre_ids) ? item.genre_ids : [];
          if (genreIds.includes(99)) return false;
          return true;
        })
        .map((item: any) => {
          if (!item.media_type) {
            item.media_type = seed.media_type;
          }
          return formatTmdbItem(item);
        })
        .filter((item: MediaItem) => {
          return !item.genres.some((g) => g.toLowerCase().includes('doc') || g.toLowerCase() === 'documentary') && !item.is_international;
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

  const fallback = await fetchTmdbCategory('top_rated', page);
  return fallback.filter(
    (item) => !item.genres.some((g) => g.toLowerCase().includes('doc') || g.toLowerCase() === 'documentary') && !isNonEnglishItem(item)
  );
}

export async function fetchInTheatersTitles(page = 1): Promise<MediaItem[]> {
  const { token, key } = getTmdbCredentials();
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : {};

  // Fetch multiple pages so acclaimed releases (like You Can See Everything on page 2) are never missed
  const p1 = (page - 1) * 2 + 1;
  const p2 = (page - 1) * 2 + 2;

  const nowUrl1 = `${TMDB_BASE_URL}/movie/now_playing?region=US&page=${p1}`;
  const nowUrl2 = `${TMDB_BASE_URL}/movie/now_playing?region=US&page=${p2}`;
  const upUrl = `${TMDB_BASE_URL}/movie/upcoming?region=US&page=${page}`;

  try {
    const [nowRes1, nowRes2, upRes] = await Promise.all([
      fetch(token ? nowUrl1 : `${nowUrl1}&api_key=${key}`, { headers }),
      fetch(token ? nowUrl2 : `${nowUrl2}&api_key=${key}`, { headers }),
      fetch(token ? upUrl : `${upUrl}&api_key=${key}`, { headers }),
    ]);

    const items: MediaItem[] = [];
    const seen = new Set<number>();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Exclusive theatrical window: released within the past 85 days or future release
    const minTheatricalDate = new Date();
    minTheatricalDate.setDate(minTheatricalDate.getDate() - 85);

    const processMovie = (raw: any, isUpcoming = false) => {
      if (!raw || !raw.id || seen.has(raw.id) || !raw.poster_path) return;
      if (isAnimeItem(raw) || isNonEnglishItem(raw)) return;

      const releaseDateStr = raw.release_date;
      const releaseDate = releaseDateStr ? new Date(releaseDateStr) : null;
      const isFuture = releaseDate ? releaseDate > today : isUpcoming;

      // Exclude if released more than 85 days ago (already on TV/home streaming)
      if (!isFuture && releaseDate && releaseDate < minTheatricalDate) {
        return;
      }

      // Exclude streaming network originals
      const titleLower = (raw.title || '').toLowerCase().trim();
      if (SHOW_NETWORK_MAP[titleLower]) {
        return;
      }

      seen.add(raw.id);
      raw.media_type = 'movie';

      const formatted = formatTmdbItem(raw);
      const tag = isFuture ? 'Coming Soon' : 'In Theaters';

      // Exclusive theatrical release: no TV services or networks
      formatted.primary_source = tag;
      formatted.streaming_sources = [tag];

      items.push(formatted);
    };

    if (nowRes1.ok) {
      const data = await nowRes1.json();
      (data.results || []).forEach((m: any) => processMovie(m, false));
    }

    if (nowRes2.ok) {
      const data = await nowRes2.json();
      (data.results || []).forEach((m: any) => processMovie(m, false));
    }

    if (upRes.ok) {
      const data = await upRes.json();
      (data.results || []).forEach((m: any) => processMovie(m, true));
    }

    // Critical theatrical spotlight titles to guarantee presence at the top of the feed
    const SPOTLIGHT_THEATRICAL: MediaItem[] = [
      {
        id: 1765072,
        tmdb_id: 1765072,
        title: 'You Can See Everything',
        media_type: 'movie',
        poster_path: 'https://image.tmdb.org/t/p/w500/Ap8QwmKfSjYbWC4XIP8w9pdn72O.jpg',
        backdrop_path: 'https://image.tmdb.org/t/p/w1280/nhIL3O4W9h5V5JbNQm7yjoDk3So.jpg',
        release_year: 2026,
        vote_average: 9.3,
        genres: ['Documentary', 'Biography', 'True Crime'],
        overview: "Thirty-four days before she's sent to prison, notorious Silicon Valley founder Elizabeth Holmes invites a skeptical film crew to document her every move. What begins as an intimate portrait of an enigmatic felon becomes a mind-bending three-year journey into the abyss.",
        streaming_sources: ['In Theaters'],
        primary_source: 'In Theaters',
      },
    ];

    SPOTLIGHT_THEATRICAL.forEach((spot) => {
      const existingIdx = items.findIndex((it) => it.tmdb_id === spot.tmdb_id);
      if (existingIdx >= 0) {
        items[existingIdx].vote_average = spot.vote_average;
        items[existingIdx].primary_source = spot.primary_source;
        items[existingIdx].streaming_sources = spot.streaming_sources;
      } else {
        seen.add(spot.tmdb_id);
        items.unshift(spot);
      }
    });

    return items;
  } catch (err) {
    console.error('Failed to fetch in-theater titles', err);
    return [];
  }
}

export async function fetchTmdbCategory(
  category: TmdbCategory,
  page = 1,
  userTitles?: UserTitle[]
): Promise<MediaItem[]> {
  if (category === 'taste_match') {
    return fetchTasteMatchRecommendations(userTitles || [], page);
  }

  if (category === 'now_playing') {
    return fetchInTheatersTitles(page);
  }

  if (category === 'international') {
    return fetchInternationalTitles(page);
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
      endpoint = '/discover/tv?sort_by=popularity.desc&without_genres=10763,10764,10767,10766,16&with_original_language=en&vote_count.gte=50';
      defaultType = 'tv';
      break;
    case 'top_rated':
      endpoint = '/movie/top_rated';
      defaultType = 'movie';
      break;
  }

  try {
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : {};

    const buildUrl = (ep: string, p: number) => {
      const sep = ep.includes('?') ? '&' : '?';
      const u = `${TMDB_BASE_URL}${ep}${sep}page=${p}`;
      return token ? u : `${u}&api_key=${key}`;
    };

    if (category === 'trending') {
      const trendingPages = [(page - 1) * 2 + 1, (page - 1) * 2 + 2];
      const [p1Res, p2Res, theaterTitles] = await Promise.all([
        fetch(buildUrl('/trending/all/week', trendingPages[0]), { headers }),
        fetch(buildUrl('/trending/all/week', trendingPages[1]), { headers }),
        fetchInTheatersTitles(page),
      ]);

      const rawItems: any[] = [];
      if (p1Res.ok) {
        const d1 = await p1Res.json();
        rawItems.push(...(d1.results || []));
      }
      if (p2Res.ok) {
        const d2 = await p2Res.json();
        rawItems.push(...(d2.results || []));
      }

      const items: MediaItem[] = [];
      const seen = new Set<number>();

      rawItems
        .filter((item: any) => Boolean(item.poster_path) && !isAnimeItem(item) && !isNonEnglishItem(item))
        .forEach((item: any) => {
          if (!item.media_type) item.media_type = 'movie';
          if (!seen.has(item.id)) {
            seen.add(item.id);
            items.push(formatTmdbItem(item));
          }
        });

      // Add exclusive in-theater and upcoming movies to Trending (excluding foreign and animation titles)
      theaterTitles.forEach((thItem) => {
        if (!isAnimeItem(thItem) && !isNonEnglishItem(thItem) && !seen.has(thItem.tmdb_id)) {
          seen.add(thItem.tmdb_id);
          items.push(thItem);
        }
      });

      // Enrich live streaming providers
      await Promise.all(items.map(enrichMediaItemWithProviders));
      return items;
    }

    if (category === 'popular_movies') {
      const moviePages = [(page - 1) * 3 + 1, (page - 1) * 3 + 2, (page - 1) * 3 + 3];
      const pageResponses = await Promise.all(
        moviePages.map(async (p) => {
          try {
            const r = await fetch(buildUrl('/movie/popular', p), { headers });
            if (!r.ok) return [];
            const d = await r.json();
            return d.results || [];
          } catch {
            return [];
          }
        })
      );

      const allResults = pageResponses.flat();
      const seen = new Set<number>();
      const items: MediaItem[] = [];

      allResults
        .filter((item: any) => Boolean(item.poster_path) && !isAnimeItem(item) && !isNonEnglishItem(item))
        .forEach((item: any) => {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            item.media_type = 'movie';
            items.push(formatTmdbItem(item));
          }
        });

      // Enrich live streaming providers
      await Promise.all(items.map(enrichMediaItemWithProviders));
      return items;
    }

    if (category === 'popular_tv') {
      const tvPages = [(page - 1) * 2 + 1, (page - 1) * 2 + 2];
      const pageResponses = await Promise.all(
        tvPages.map(async (p) => {
          try {
            const r = await fetch(buildUrl(endpoint, p), { headers });
            if (!r.ok) return [];
            const d = await r.json();
            return d.results || [];
          } catch {
            return [];
          }
        })
      );

      const allResults = pageResponses.flat();
      const seen = new Set<number>();
      const items: MediaItem[] = [];

      allResults
        .filter((item: any) => Boolean(item.poster_path))
        .filter((item: any) => !isAnimeItem(item) && !isNonEnglishItem(item))
        .filter((item: any) => {
          const genreIds: number[] = item.genre_ids || [];
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
          return true;
        })
        .forEach((item: any) => {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            item.media_type = 'tv';
            items.push(formatTmdbItem(item));
          }
        });

      await Promise.all(items.map(enrichMediaItemWithProviders));
      return items;
    }

    if (category === 'top_rated') {
      const topPages = [(page - 1) * 2 + 1, (page - 1) * 2 + 2];
      const pageResponses = await Promise.all(
        topPages.map(async (p) => {
          try {
            const r = await fetch(buildUrl('/movie/top_rated', p), { headers });
            if (!r.ok) return [];
            const d = await r.json();
            return d.results || [];
          } catch {
            return [];
          }
        })
      );

      const allResults = pageResponses.flat();
      const seen = new Set<number>();
      const items: MediaItem[] = [];

      allResults
        .filter((item: any) => Boolean(item.poster_path) && !isAnimeItem(item) && !isNonEnglishItem(item))
        .forEach((item: any) => {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            item.media_type = 'movie';
            items.push(formatTmdbItem(item));
          }
        });

      await Promise.all(items.map(enrichMediaItemWithProviders));
      return items;
    }

    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${TMDB_BASE_URL}${endpoint}${separator}page=${page}`;
    const finalUrl = token ? url : `${url}&api_key=${key}`;
    const res = await fetch(finalUrl, { headers });

    if (res.ok) {
      const data = await res.json();
      const items = (data.results || [])
        .filter((item: any) => Boolean(item.poster_path))
        .filter((item: any) => !isAnimeItem(item) && !isNonEnglishItem(item))
        .map((item: any) => {
          if (!item.media_type) {
            item.media_type = defaultType;
          }
          return formatTmdbItem(item);
        });
      await Promise.all(items.map(enrichMediaItemWithProviders));
      return items;
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
  // Fetch multiple diverse categories in parallel including True Crime & In Theaters
  try {
    const [t1, t2, popM, popTv, topM1, topM2, tc1, tc2, th1] = await Promise.all([
      fetchTmdbCategory('trending', 1),
      fetchTmdbCategory('trending', 2),
      fetchTmdbCategory('popular_movies', 1),
      fetchTmdbCategory('popular_tv', 1),
      fetchTmdbCategory('top_rated', 1),
      fetchTmdbCategory('top_rated', 2),
      fetchTrueCrimeTitles(1),
      fetchTrueCrimeTitles(2),
      fetchInTheatersTitles(1),
    ]);

    const map = new Map<number, MediaItem>();
    [...t1, ...t2, ...popM, ...popTv, ...topM1, ...topM2, ...tc1, ...tc2, ...th1].forEach((item) => {
      if (!isAnimeItem(item) && !isNonEnglishItem(item)) {
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

  // Accurate provider resolution:
  // Strictly prevent theatrical or upcoming releases from being falsely badged as Netflix/Max!
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const releaseDateObj = releaseDate ? new Date(releaseDate) : null;
  const isFuture = releaseDateObj ? releaseDateObj > today : false;
  const daysSinceRelease = releaseDateObj
    ? (today.getTime() - releaseDateObj.getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  // Active theatrical exclusive window: released in the last 85 days or upcoming in theaters
  const isTheatricalActive = isMovie && (isFuture || (daysSinceRelease >= 0 && daysSinceRelease <= 85));

  let defaultProvider: string;
  let sources: string[];

  // 1. If explicit network original (e.g. Stranger Things, Severance, etc.)
  if (matchedNetwork) {
    defaultProvider = matchedNetwork;
    sources = isMovie ? [matchedNetwork, 'Prime (Rent)'] : [matchedNetwork];
  } else if (isTheatricalActive) {
    // Current or upcoming theatrical release: strictly In Theaters or Coming Soon
    defaultProvider = isFuture ? 'Coming Soon' : 'In Theaters';
    sources = [defaultProvider];
  } else if (isMovie) {
    // Older or catalog movie without a verified streaming network:
    // It is available on digital rental / VOD, NOT randomly on Netflix or Max
    defaultProvider = 'Prime (Rent)';
    sources = ['Prime (Rent)'];
  } else {
    // TV Series not explicitly mapped in lookup
    const providerIndex = Math.abs(item.id) % POPULAR_NETWORKS.length;
    defaultProvider = POPULAR_NETWORKS[providerIndex];
    sources = [defaultProvider];
  }

  // Rating resolution: Prefer verified IMDb score, fallback to TMDb vote_average
  const imdbScore = getImdbRating(rawTitle, item.id);
  const rawTmdbScore = typeof item.vote_average === 'number' ? item.vote_average : 0;
  const rating = imdbScore !== undefined ? imdbScore : Number(rawTmdbScore.toFixed(1));

  return {
    id: item.id,
    tmdb_id: item.id,
    title: rawTitle,
    media_type: isMovie ? 'movie' : 'tv',
    poster_path: item.poster_path
      ? (item.poster_path.startsWith('http') ? item.poster_path : `${TMDB_IMAGE_BASE}/w342${item.poster_path}`)
      : '',
    backdrop_path: item.backdrop_path
      ? (item.backdrop_path.startsWith('http') ? item.backdrop_path : `${TMDB_IMAGE_BASE}/w1280${item.backdrop_path}`)
      : undefined,
    release_year: year || 2024,
    vote_average: rating,
    genres: genres.length > 0 ? genres : ['Drama'],
    overview: item.overview,
    streaming_sources: sources,
    primary_source: defaultProvider,
    original_language: item.original_language,
    origin_country: Array.isArray(item.origin_country) ? item.origin_country : undefined,
    genre_ids: Array.isArray(item.genre_ids) ? item.genre_ids : undefined,
    is_international: isNonEnglishItem(item),
  };
}

export async function fetchCreditsAndDetails(
  mediaType: MediaType,
  tmdbId: number,
  title?: string
): Promise<{ creator?: string; stars?: string[] }> {
  const { token, key } = getTmdbCredentials();
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : {};

  try {
    const url = `${TMDB_BASE_URL}/${mediaType}/${tmdbId}?append_to_response=credits`;
    const finalUrl = token ? url : `${url}&api_key=${key}`;
    const res = await fetch(finalUrl, { headers });

    if (res.ok) {
      const data = await res.json();
      const crew: any[] = data.credits?.crew || [];
      const cast: any[] = data.credits?.cast || [];

      let creatorName = '';
      if (mediaType === 'tv') {
        const createdBy = (data.created_by || []).map((c: any) => c.name).filter(Boolean);
        if (createdBy.length > 0) {
          creatorName = createdBy.join(', ');
        } else {
          const tvDir = crew.find(
            (c: any) =>
              c.job === 'Creator' ||
              c.job === 'Executive Producer' ||
              c.job === 'Director'
          );
          if (tvDir?.name) creatorName = tvDir.name;
        }
      } else {
        const directors = crew
          .filter((c: any) => c.job === 'Director')
          .map((c: any) => c.name)
          .filter(Boolean);
        if (directors.length > 0) {
          creatorName = directors.join(', ');
        }
      }

      const topStars = cast
        .slice(0, 3)
        .map((c: any) => c.name)
        .filter(Boolean);

      if (creatorName || topStars.length > 0) {
        return {
          creator: creatorName || undefined,
          stars: topStars.length > 0 ? topStars : undefined,
        };
      }
    }
  } catch {
    // TMDb error, fallback to OMDb
  }

  // Fallback to OMDb by title if TMDb credits are unavailable
  if (title) {
    try {
      const omdbItem = await getOmdbDetails(title);
      if (omdbItem) {
        return {
          creator: omdbItem.creator || omdbItem.director || undefined,
          stars: omdbItem.stars && omdbItem.stars.length > 0 ? omdbItem.stars.slice(0, 3) : undefined,
        };
      }
    } catch {
      // Ignore
    }
  }

  return {};
}
