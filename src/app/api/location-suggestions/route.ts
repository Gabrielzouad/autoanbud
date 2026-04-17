import { NextRequest, NextResponse } from 'next/server';

const MUNICIPALITIES_URL = 'https://ws.geonorge.no/kommuneinfo/v1/kommuner';
const COUNTIES_URL = 'https://ws.geonorge.no/kommuneinfo/v1/fylker';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
let municipalityCache: Array<{ name: string; number: string; county: string; display_name: string }> | null = null;
let lastCacheTime = 0;

type MunicipalityInfo = {
  name: string;
  number: string;
  county: string;
  display_name: string;
};

async function loadKommuneInfo(): Promise<MunicipalityInfo[]> {
  if (municipalityCache && Date.now() - lastCacheTime < CACHE_DURATION) {
    return municipalityCache;
  }

  const [municipalityRes, countyRes] = await Promise.all([
    fetch(MUNICIPALITIES_URL),
    fetch(COUNTIES_URL),
  ]);

  if (!municipalityRes.ok || !countyRes.ok) {
    throw new Error('Kunne ikke hente kommuneinfo-data fra Norgeskart');
  }

  const municipalities = await municipalityRes.json();
  const counties = await countyRes.json();
  const countyMap = counties.reduce((map: Record<string, string>, county: any) => {
    if (county.fylkesnummer && county.fylkesnavn) {
      map[county.fylkesnummer.padStart(2, '0')] = county.fylkesnavn;
    }
    return map;
  }, {});

  municipalityCache = municipalities.map((item: any) => {
    const name = item.kommunenavn || item.kommunenavnNorsk || '';
    const number = item.kommunenummer || '';
    const county = number ? countyMap[number.substring(0, 2)] || '' : '';
    const display_name = [name, county].filter(Boolean).join(', ');
    return { name, number, county, display_name };
  });

  lastCacheTime = Date.now();
  return municipalityCache as MunicipalityInfo[];
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const municipalities = await loadKommuneInfo();
    const lowerQuery = query.toLowerCase();

    const suggestions = municipalities
      .filter((item) =>
        item.display_name.toLowerCase().includes(lowerQuery) ||
        item.name.toLowerCase().includes(lowerQuery) ||
        item.county.toLowerCase().includes(lowerQuery),
      )
      .slice(0, 10)
      .map((item) => ({
        display_name: item.display_name,
        municipality: item.name,
        county: item.county,
        kommunenummer: item.number,
      }));

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Failed to fetch location suggestions:', error);
    return NextResponse.json([], { status: 200 });
  }
}
