import { MediaItem, UserTitle } from '@/types/media';

export async function rankWithJev(
  candidates: MediaItem[],
  userTitles: UserTitle[],
  activeFilters?: { genres?: string[]; decades?: string[]; services?: string[] }
): Promise<MediaItem[]> {
  if (!candidates || candidates.length <= 1) return candidates;

  try {
    const userFavorites = (userTitles || [])
      .filter(
        (t) =>
          (t.status === 'watched' && (t.rating || 0) >= 7) ||
          t.status === 'want_to_watch' ||
          t.status === 'watching'
      )
      .map((t) => ({
        title: t.media?.title || '',
        release_year: t.media?.release_year,
        genres: t.media?.genres || [],
      }))
      .filter((t) => Boolean(t.title));

    const res = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userFavorites,
        candidates,
        activeFilters,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.candidates) && data.candidates.length > 0) {
        // Re-order original MediaItems to preserve posters and provider sources
        const itemMap = new Map<number, MediaItem>();
        candidates.forEach((c) => itemMap.set(c.tmdb_id, c));

        const reordered: MediaItem[] = [];
        data.candidates.forEach((c: any) => {
          const item = itemMap.get(c.tmdb_id);
          if (item) reordered.push(item);
        });

        // Append any items that were not in the reordered output
        candidates.forEach((c) => {
          if (!reordered.some((r) => r.tmdb_id === c.tmdb_id)) {
            reordered.push(c);
          }
        });

        return reordered;
      }
    }
  } catch (err) {
    // Fail silently to normal recommendation order
    console.warn('Jev ranking skipped:', err);
  }

  return candidates;
}
