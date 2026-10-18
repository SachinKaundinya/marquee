import { NextResponse } from 'next/server';

interface CandidateInput {
  tmdb_id: number;
  title: string;
  media_type: 'movie' | 'tv';
  genres?: string[];
  overview?: string;
  release_year?: number;
  vote_average?: number;
  primary_source?: string;
  streaming_sources?: string[];
}

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { userFavorites, candidates, activeFilters } = await req.json();

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ candidates: [], usedAI: false });
    }

    // Check for Vercel AI Gateway keys, with fallback to OpenRouter / Jev
    const vercelGatewayKey =
      process.env.AI_GATEWAY_API_KEY ||
      process.env.VERCEL_AI_GATEWAY_KEY ||
      process.env.VERCEL_AI_GATEWAY_API_KEY ||
      process.env.VERCEL_AI_GATEWAY ||
      process.env.AI_GATEWAY_KEY ||
      process.env.GATEWAY_API_KEY ||
      process.env.AI_KEY;

    const openRouterKey =
      process.env.OPENROUTER_API_KEY ||
      process.env.JEV_API_KEY ||
      process.env.TYPESAFE_API_KEY;

    const apiKey = vercelGatewayKey || openRouterKey;

    if (!apiKey) {
      const detectedEnvKeys = Object.keys(process.env).filter(
        (k) =>
          k.toLowerCase().includes('gateway') ||
          k.toLowerCase().includes('ai_') ||
          k.toLowerCase().includes('openrouter') ||
          k.toLowerCase().includes('jev')
      );

      return NextResponse.json({
        candidates,
        usedAI: false,
        message: 'No AI_GATEWAY_API_KEY configured. Using TMDb recommendation pipeline.',
        detectedEnvKeys,
      });
    }

    // 1. If Vercel AI Gateway key is provided
    if (vercelGatewayKey) {
      const candidatesToRank = candidates.slice(0, 24);
      const remainingCandidates = candidates.slice(24);

      const candidateListStr = candidatesToRank
        .map(
          (c: CandidateInput, idx: number) =>
            `${idx + 1}. [id: ${c.tmdb_id}] "${c.title}" (${c.release_year || 'N/A'}, ${c.media_type === 'movie' ? 'Movie' : 'Series'}) - Genres: ${(c.genres || []).join(', ')}. Streams on: ${(c.streaming_sources || [c.primary_source]).filter(Boolean).join(', ') || 'VOD'}. Synopsis: ${(c.overview || '').slice(0, 150)}`
        )
        .join('\n');

      const favoritesStr = Array.isArray(userFavorites) && userFavorites.length > 0
        ? userFavorites
            .slice(0, 10)
            .map((f: any) => `"${f.title}" (${f.genres?.join('/') || 'Cinema'}, Rating: ${f.rating || 8}+)`)
            .join(', ')
        : 'Acclaimed cinema and drama';

      const filtersStr = [
        activeFilters?.genres?.length ? `Preferred Genres: ${activeFilters.genres.join(', ')}` : null,
        activeFilters?.decades?.length ? `Decades: ${activeFilters.decades.join(', ')}` : null,
        activeFilters?.services?.length ? `Available on: ${activeFilters.services.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join(' | ') || 'None';

      const prompt = `You are Mirar's AI Cinephile Recommendation Engine.
User Taste Profile (Loved Films & TV Series):
${favoritesStr}

Active Constraints:
${filtersStr}

Candidate Titles:
${candidateListStr}

Instructions:
1. Analyze the user's taste, tone, and stylistic preferences based on their loved titles and active constraints.
2. Re-rank ALL candidate IDs in descending order of personal recommendation fit (highest match first).
3. Return ONLY valid JSON with this exact structure:
{
  "ranked_ids": [number, number, ...],
  "highlights": [
    { "tmdb_id": number, "reason": "Short 1-sentence personalized pitch (max 15 words)" }
  ]
}`;

      const gatewayRes = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelGatewayKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are an expert film and television recommendation engine that strictly outputs valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (gatewayRes.ok) {
        const result = await gatewayRes.json();
        const content = result.choices?.[0]?.message?.content;
        if (content) {
          try {
            const parsed = JSON.parse(content);
            const rankedIds: number[] = Array.isArray(parsed.ranked_ids) ? parsed.ranked_ids : [];

            if (rankedIds.length > 0) {
              const candidateMap = new Map<number, CandidateInput>();
              candidatesToRank.forEach((c: CandidateInput) => candidateMap.set(c.tmdb_id, c));

              const sorted: CandidateInput[] = [];
              rankedIds.forEach((id) => {
                const item = candidateMap.get(id);
                if (item) {
                  sorted.push(item);
                  candidateMap.delete(id);
                }
              });

              // Append any unranked candidates from the first batch
              candidateMap.forEach((item) => sorted.push(item));

              return NextResponse.json({
                candidates: [...sorted, ...remainingCandidates],
                usedAI: true,
                provider: 'Vercel AI Gateway (Gemini 2.5 Flash)',
              });
            }
          } catch {
            // fallback
          }
        }
      } else {
        const errText = await gatewayRes.text().catch(() => '');
        console.warn('Vercel AI Gateway response not ok:', gatewayRes.status, errText);
        return NextResponse.json({
          candidates,
          usedAI: false,
          gatewayStatus: gatewayRes.status,
          gatewayError: errText,
        });
      }
    }

    // 2. Fallback to OpenRouter / Jev if OpenRouter key is set
    if (openRouterKey) {
      const candidatesToScore = candidates.slice(0, 20);
      const criteria: Record<string, string> = {};
      candidatesToScore.forEach((c: CandidateInput) => {
        criteria[`c_${c.tmdb_id}`] = `${c.title} (${c.release_year || 'N/A'}) - Genres: ${(c.genres || []).join(', ')}`;
      });

      const jevRes = await fetch('https://openrouter.ai/api/alpha/decisions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'typesafe/jev-1.14',
          state: `User favorites: ${(userFavorites || []).slice(0, 8).map((f: any) => f.title).join(', ')}`,
          questions: {
            taste_match: {
              type: 'choice',
              instructions: 'Which candidate best matches user taste?',
              criteria,
            },
          },
        }),
      });

      if (jevRes.ok) {
        const data = await jevRes.json();
        const scores = data?.questions?.taste_match?.scores || data?.scores || {};
        const sorted = [...candidatesToScore].sort((a, b) => {
          const scoreA = scores[`c_${a.tmdb_id}`] ?? 0;
          const scoreB = scores[`c_${b.tmdb_id}`] ?? 0;
          return scoreB - scoreA;
        });

        return NextResponse.json({
          candidates: [...sorted, ...candidates.slice(20)],
          usedAI: true,
          provider: 'Jev / OpenRouter',
        });
      }
    }

    // Graceful fallback to candidate list
    return NextResponse.json({ candidates, usedAI: false });
  } catch (err: any) {
    console.error('AI recommendation error:', err);
    return NextResponse.json({ candidates: [], usedAI: false, error: err.message }, { status: 500 });
  }
}
