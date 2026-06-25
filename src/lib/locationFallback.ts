export type ResolvedLocation = {
  city: string | null;
  lat: number | null;
  lng: number | null;
  source: 'browser' | 'ip';
};

type LocationFallbackResponse = {
  location?: ResolvedLocation | null;
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
        resolve({
          city: null,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
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
  });

  if (!response.ok) return null;

  const payload: LocationFallbackResponse = await response
    .json()
    .catch(() => ({ location: null }));

  return payload.location ?? null;
}

export async function resolveLocationWithFallback(): Promise<ResolvedLocation> {
  try {
    return await getBrowserCoordinates();
  } catch {
    const fallback = await getIpFallbackLocation();
    if (fallback) return fallback;

    throw new Error(
      'Kunne ikke hente posisjon. Skriv inn sted eller adresse manuelt.',
    );
  }
}
