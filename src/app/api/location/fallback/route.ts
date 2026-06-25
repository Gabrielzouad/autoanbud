import { NextResponse } from 'next/server';

function decodeHeaderValue(value: string | null) {
  if (!value) return null;

  try {
    return decodeURIComponent(value).trim() || null;
  } catch {
    return value.trim() || null;
  }
}

function readNumber(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const headers = request.headers;
  const city =
    decodeHeaderValue(headers.get('x-vercel-ip-city')) ??
    decodeHeaderValue(headers.get('x-openai-user-city'));
  const countryRegion =
    decodeHeaderValue(headers.get('x-vercel-ip-country-region')) ??
    decodeHeaderValue(headers.get('x-openai-user-region'));
  const lat =
    readNumber(headers.get('x-vercel-ip-latitude')) ??
    readNumber(headers.get('x-openai-user-latitude'));
  const lng =
    readNumber(headers.get('x-vercel-ip-longitude')) ??
    readNumber(headers.get('x-openai-user-longitude'));

  if (!city && (lat === null || lng === null)) {
    return NextResponse.json(
      {
        location: null,
        reason: 'missing_location_headers',
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    location: {
      city: [city, countryRegion].filter(Boolean).join(', ') || null,
      lat,
      lng,
      source: 'ip',
    },
  });
}
