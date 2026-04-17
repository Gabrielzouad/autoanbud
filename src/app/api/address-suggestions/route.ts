import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for address suggestions
const cache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  console.log('Address suggestions request:', { q });

  // Normalize query: trim whitespace (keep original case for better API matching)
  const normalizedQuery = q?.trim() || '';

  if (normalizedQuery.length < 3) {
    console.log('Query too short or missing');
    return NextResponse.json([]);
  }

  // Check cache first (use lowercase for cache key to avoid duplicates)
  const cacheKey = normalizedQuery.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Returning cached result for:', cacheKey);
    return NextResponse.json(cached.data);
  }

  try {
    // Small delay to help with rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));

    // Use Norgeskart API with fuzzy search enabled for better matching
    const norgeskartUrl = `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(normalizedQuery)}&fuzzy=true&treffPerSide=5`;
    console.log('Fetching from Norgeskart:', norgeskartUrl);

    const response = await fetch(norgeskartUrl);

    console.log('Norgeskart response status:', response.status);

    if (response.status === 429) {
      // Rate limited - return cached data if available, otherwise wait and retry once
      console.log('Rate limited by Norgeskart');
      if (cached) {
        console.log('Returning stale cached data due to rate limit');
        return NextResponse.json(cached.data);
      }

      // Wait 2 seconds and try once more
      console.log('Waiting 2 seconds and retrying...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const retryResponse = await fetch(norgeskartUrl);

      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        console.log('Retry successful:', retryData.adresser?.length || 0, 'results');

        // Transform Norgeskart response to match our expected format
        const transformedData = transformNorgeskartData(retryData.adresser || []);
        cache.set(cacheKey, { data: transformedData, timestamp: Date.now() });
        return NextResponse.json(transformedData);
      }

      console.log('Retry also failed');
      return NextResponse.json([]);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Norgeskart error:', response.status, errorText);
      throw new Error(`Norgeskart API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Norgeskart data:', data.adresser?.length || 0, 'results');
    if (data.adresser?.length > 0) {
      console.log('First result:', JSON.stringify(data.adresser[0], null, 2));
    }

    // Transform Norgeskart response to match our expected format
    const transformedData = transformNorgeskartData(data.adresser || []);
    cache.set(cacheKey, { data: transformedData, timestamp: Date.now() });

    // Clean up old cache entries (keep cache size reasonable)
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Failed to fetch address suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}

// Transform Norgeskart API response to match our expected format
function transformNorgeskartData(adresser: any[]): any[] {
  return adresser.map(addr => {
    // Build a comprehensive display name with all available information
    const streetName = addr.adressenavn || '';
    const number = addr.nummer || '';
    const letter = addr.bokstav || '';
    const houseNumber = number ? `${number}${letter}` : '';
    const postalCode = addr.postnummer || '';
    const city = addr.poststed || '';

    // Always construct display name to include postal code and city for complete address info
    const parts = [];
    if (streetName) parts.push(streetName);
    if (houseNumber) parts.push(houseNumber);
    if (postalCode || city) parts.push(`${postalCode} ${city}`.trim());
    const displayName = parts.join(' ').trim();

    // Ensure we have coordinates
    const lat = addr.representasjonspunkt?.lat || 0;
    const lon = addr.representasjonspunkt?.lon || 0;

    return {
      display_name: displayName,
      lat,
      lon,
      // Include additional data for debugging
      street: streetName,
      number: houseNumber,
      postalCode,
      city,
    };
  });
}