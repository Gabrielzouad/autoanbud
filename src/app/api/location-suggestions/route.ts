import { NextRequest, NextResponse } from 'next/server';

const cache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const normalizedQuery = q?.trim() || '';

  if (normalizedQuery.length < 2) {
    return NextResponse.json([]);
  }

  const cacheKey = normalizedQuery.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const norgeskartUrl = `https://ws.geonorge.no/stedsnavn/v1/sok?navn=${encodeURIComponent(normalizedQuery)}&fuzzy=true&treffPerSide=10`;
    const response = await fetch(norgeskartUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Norgeskart location error:', response.status, errorText);
      throw new Error(`Norgeskart API error: ${response.status}`);
    }

    const data = await response.json();
    const results = data.stedsnavn || data.navn || [];
    const transformed = transformLocationData(results);

    cache.set(cacheKey, { data: transformed, timestamp: Date.now() });
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) cache.delete(oldestKey);
    }

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Failed to fetch location suggestions:', error);
    return NextResponse.json([], { status: 500 });
  }
}

function transformLocationData(items: any[]): any[] {
  return items
    .map((item) => {
      const name = item.navn || item.navnMedSted || '';
      const municipality = item.kommunenavn || item.kommune || '';
      const county = item.fylkenavn || item.fylke || '';
      const type = item.stedstype?.navn || item.type || '';
      const displayName = [name, municipality, county]
        .filter(Boolean)
        .join(', ');

      return {
        display_name: displayName || name,
        name,
        municipality,
        county,
        type,
      };
    })
    .filter((item) => item.display_name);
}
