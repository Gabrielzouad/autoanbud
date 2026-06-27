import { normalizeCoordinates } from '@/lib/geo';

export type ResolvedLocation = {
  city: string | null;
  lat: number | null;
  lng: number | null;
  source: 'browser' | 'ip';
};

type LocationFallbackResponse = {
  location?: ResolvedLocation | null;
};

type ResolveLocationOptions = {
  requireCoordinates?: boolean;
};

function getBrowserCoordinates(timeoutMs = 8000): Promise<ResolvedLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Nettleseren støtter ikke posisjon.'));
      return;
    }

    const timeout = window.setTimeout(() => {
      reject(new Error('Posisjonssøk tok for lang tid.'));
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timeout);
        const coordinates = normalizeCoordinates(
          position.coords.latitude,
          position.coords.longitude,
        );
        if (!coordinates) {
          reject(new Error('Nettleseren returnerte ugyldige koordinater.'));
          return;
        }

        resolve({
          city: null,
          lat: coordinates.lat,
          lng: coordinates.lng,
          source: 'browser',
        });
      },
      (error) => {
        window.clearTimeout(timeout);
        reject(new Error(error.message || 'Kunne ikke hente posisjon.'));
      },
      {
        enableHighAccuracy: false,
        maximumAge: 10 * 60 * 1000,
        timeout: timeoutMs,
      },
    );
  });
}

async function getIpFallbackLocation(): Promise<ResolvedLocation | null> {
  const response = await fetch('/api/location/fallback', {
    cache: 'no-store',
  }).catch(() => null);

  if (!response?.ok) return null;

  const payload: LocationFallbackResponse = await response
    .json()
    .catch(() => ({ location: null }));

  const location = payload.location ?? null;
  if (!location) return null;

  const coordinates = normalizeCoordinates(location.lat, location.lng);
  if (!coordinates) return null;

  return {
    ...location,
    lat: coordinates.lat,
    lng: coordinates.lng,
  };
}

export async function resolveLocationWithFallback(
  options: ResolveLocationOptions = {},
): Promise<ResolvedLocation> {
  const requireCoordinates = options.requireCoordinates ?? true;

  try {
    const location = await getBrowserCoordinates();
    if (!requireCoordinates || normalizeCoordinates(location.lat, location.lng)) {
      return location;
    }
  } catch {
    const fallback = await getIpFallbackLocation();
    if (
      fallback &&
      (!requireCoordinates || normalizeCoordinates(fallback.lat, fallback.lng))
    ) {
      return fallback;
    }

    throw new Error(
      'Kunne ikke hente posisjon. Skriv inn sted eller adresse manuelt.',
    );
  }

  throw new Error(
    'Kunne ikke hente posisjon. Skriv inn sted eller adresse manuelt.',
  );
}
