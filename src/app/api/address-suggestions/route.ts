import { NextRequest, NextResponse } from 'next/server';
import type { AddressSuggestion } from '@/lib/addressSuggestions';
import { normalizeCoordinates } from '@/lib/geo';
import { checkRateLimit } from '@/lib/rateLimit';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function asString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return '';
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeCity(value: unknown): string {
  const city = asString(value).trim();
  if (!city) {
    return '';
  }

  return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
}

function getSearchQuery(req: NextRequest): string {
  const directQuery = req.nextUrl.searchParams.get('q')?.trim();
  if (directQuery) {
    return directQuery;
  }

  return [
    req.nextUrl.searchParams.get('address')?.trim(),
    req.nextUrl.searchParams.get('postalCode')?.trim(),
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function toAddressSuggestion(value: unknown): AddressSuggestion | null {
  if (!isRecord(value)) {
    return null;
  }

  const representasjonspunkt = isRecord(value.representasjonspunkt)
    ? value.representasjonspunkt
    : {};

  const street = asString(value.adressenavn).trim();
  const number = asString(value.nummer).trim();
  const postalCode = asString(value.postnummer).trim();
  const city = normalizeCity(value.poststed);
  const displayName = [street, number, postalCode, city]
    .filter(Boolean)
    .join(' ');
  const coordinates = normalizeCoordinates(
    asNumber(representasjonspunkt.lat),
    asNumber(representasjonspunkt.lon),
  );

  if (!displayName) {
    return null;
  }

  return {
    display_name: displayName,
    street,
    number,
    postalCode,
    city,
    lat: coordinates?.lat ?? null,
    lng: coordinates?.lng ?? null,
  };
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { allowed } = checkRateLimit(`address:${ip}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const q = getSearchQuery(req);
  if (q.length < 3) {
    return NextResponse.json([]);
  }

  const url = `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(q)}&treffPerSide=6&utkoordsys=4258`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    return NextResponse.json([], { status: 200 });
  }

  const data: unknown = await res.json();
  const adresser =
    isRecord(data) && Array.isArray(data.adresser) ? data.adresser : [];
  const suggestions = adresser
    .map(toAddressSuggestion)
    .filter((suggestion): suggestion is AddressSuggestion =>
      Boolean(suggestion),
    );

  return NextResponse.json(suggestions);
}
