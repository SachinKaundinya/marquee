import { NextResponse } from 'next/server';

interface CandidateInput {
  tmdb_id: number;
  title: string;
  media_type: 'movie' | 'tv';
  genres?: string[];
  overview?: string;
  release_year?: number;
  vote_average?: number;
}

export async function POST(req: Request) {
  try {
    const { userFavorites, candidates, activeFilters } = await req.json();

    const apiKey =
      process.env.JEV_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.TYPESAFE_API_KEY;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ candidates: [], usedJev: false });
    }

    // If no Jev key is configured, return candidate pool gracefully
    if (!apiKey) {
      return NextResponse.json({
        candidates,
        usedJev: false,
        message: 'JEV_API_KEY not set. Using TMDb recommendation pipeline.',
      });
    }

    const isNativeTypeSafe = Boolean(process.env.TYPESAFE_API_KEY);
    const endpoint = isNativeTypeSafe
      ? 'https://api.typesafe.ai/v1/systemone'
      : 'https://openrouter.ai/api/alpha/decisions';

    // Format top 8 user favorites for context state
    const favoritesSummary = Array.isArray(userFavorites)
      ? userFavorites
          .slice(0, 8)
          .map((f: any) => `${f.title} (${f.release_year || ''}, ${f.genres?.join('/') || ''})`)
          .join(', ')
      : 'Popular cinema and television';

    // Format candidate criteria map for Jev choice scoring (evaluate up to 20 candidates per batch)
    const candidatesToScore = candidates.slice(0, 20);
    const criteria: Record<string, string> = {};

    candidatesToScore.forEach((c: CandidateInput) => {
      const key = `c_${c.tmdb_id}`;
      criteria[key] = `${c.title} (${c.release_year || 'N/A'}) - Genres: ${(c.genres || []).join(', ')}. Synopsis: ${(c.overview || '').slice(0, 140)}`;
    });

    const activeFilterStr = [
      activeFilters?.genres?.length ? `Genres: ${activeFilters.genres.join(', ')}` : null,
      activeFilters?.decades?.length ? `Decades: ${activeFilters.decades.join(', ')}` : null,
      activeFilters?.services?.length ? `Services: ${activeFilters.services.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    const payload = {
      model: 'typesafe/jev-1.14',
      state: `User favorite library: ${favoritesSummary}. Active constraints: ${activeFilterStr || 'None'}. Goal: Pick the most engaging, high-quality, and taste-aligned titles for the user.`,
      questions: {
        taste_match: {
          type: 'choice',
          instructions: 'Which candidate best matches the user taste profile and constraints?',
          criteria,
        },
      },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn('Jev API error:', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ candidates, usedJev: false });
    }

    const data = await res.json();
    const scores = data?.questions?.taste_match?.scores || data?.scores || {};

    // Sort candidates according to Jev's assigned probability scores
    const sorted = [...candidatesToScore].sort((a, b) => {
      const scoreA = scores[`c_${a.tmdb_id}`] ?? 0;
      const scoreB = scores[`c_${b.tmdb_id}`] ?? 0;
      return scoreB - scoreA;
    });

    // Append remaining candidates that were outside the top-20 evaluation batch
    const remaining = candidates.slice(20);

    return NextResponse.json({
      candidates: [...sorted, ...remaining],
      usedJev: true,
      model: 'typesafe/jev-1.14',
    });
  } catch (err: any) {
    console.error('Failed to run Jev recommendations:', err);
    return NextResponse.json({ candidates: [], usedJev: false, error: err.message }, { status: 500 });
  }
}
