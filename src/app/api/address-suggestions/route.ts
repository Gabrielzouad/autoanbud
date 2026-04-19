import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q || q.length < 3) {
    return NextResponse.json([]);
  }

  const url = `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(q)}&treffPerSide=6&utkoordsys=4258`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return NextResponse.json([], { status: 200 });
  }

  const data = await res.json();
  const adresser: unknown[] = data?.adresser ?? [];

  const suggestions = adresser.map((a: any) => ({
    display_name: [a.adressenavn, a.nummer, a.postnummer, a.poststed]
      .filter(Boolean)
      .join(' '),
    street: a.adressenavn ?? '',
    number: a.nummer ?? '',
    postalCode: a.postnummer ?? '',
    city: a.poststed
      ? a.poststed.charAt(0).toUpperCase() + a.poststed.slice(1).toLowerCase()
      : '',
    lat: a.representasjonspunkt?.lat ?? null,
    lng: a.representasjonspunkt?.lon ?? null,
  }));

  return NextResponse.json(suggestions);
}
