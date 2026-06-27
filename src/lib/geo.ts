export type Coordinates = {
  lat: number;
  lng: number;
};

export function isValidLatitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;
}

function readCoordinate(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) return Number(value);
  return null;
}

export function normalizeCoordinates(
  latValue: unknown,
  lngValue: unknown,
): Coordinates | null {
  const lat = readCoordinate(latValue);
  const lng = readCoordinate(lngValue);

  if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
    return null;
  }

  return { lat, lng };
}

export function hasValidCoordinates(value: {
  lat?: unknown;
  lng?: unknown;
}): value is Coordinates {
  return normalizeCoordinates(value.lat, value.lng) !== null;
}
