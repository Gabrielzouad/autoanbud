import { NextRequest, NextResponse } from 'next/server';

const ENDPOINT = 'https://ws.geonorge.no/stedsnavn/v1/navn';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const url = new URL(ENDPOINT);
  url.searchParams.set('sok', query);
  url.searchParams.set('treffPerSide', '10');
  url.searchParams.set('side', '1');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    const data = (await response.json()) as {
      navn?: Array<{
        stedsnavn?: Array<{ skrivemåte?: string }>;
        kommuner?: Array<{ kommunenavn?: string }>;
      }>;
    };

    const suggestions = Array.from(
      new Set(
        (data.navn ?? [])
          .flatMap((item) => {
            const placeName = item.stedsnavn?.[0]?.skrivemåte?.trim();
            const kommune = item.kommuner?.[0]?.kommunenavn?.trim();

            if (placeName && kommune && placeName !== kommune) {
              return [`${placeName}, ${kommune}`];
            }

            return placeName ? [placeName] : kommune ? [kommune] : [];
          })
          .filter(Boolean),
      ),
    );

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
