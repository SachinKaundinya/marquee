import { MediaItem } from '@/types/media';
import { MOCK_CATALOG } from '@/data/mockCatalog';
import { searchOmdb } from './omdb';

export async function searchTitles(query: string): Promise<MediaItem[]> {
  if (!query.trim()) {
    return MOCK_CATALOG;
  }

  // 1. Primary Live Search: OMDb API with real IMDb database and Amazon CDN posters
  try {
    const omdbResults = await searchOmdb(query);
    if (omdbResults.length > 0) {
      return omdbResults;
    }
  } catch {
    // Fallback to local catalog
  }

  // 2. Fallback to local catalog fuzzy match
  const q = query.toLowerCase();
  return MOCK_CATALOG.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.genres.some((g) => g.toLowerCase().includes(q))
  );
}

export async function getTrendingTitles(): Promise<MediaItem[]> {
  return MOCK_CATALOG;
}
